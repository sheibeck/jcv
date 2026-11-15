import { JiraTicket } from "./JiraTicket";
import { fetchSettings, type UserSettings } from "./UserSettings";
import { parseIssueLinks, setLinks, type IssueLink } from "./IssueLinks";

// running a custom cors proxy on heroku.
const CORS_PROXY = 'https://jvc-cors-proxy-7bc908c62bc1.herokuapp.com/';
const JIRA_BASE = 'https://dealeron.atlassian.net';
// Link lookups for versioned tickets run this many requests at a time.
const LINK_FETCH_CONCURRENCY = 6;

/** A failed Jira request; `status` is the HTTP status (0 = network/CORS failure). */
export class JiraRequestError extends Error {
    constructor(public readonly status: number, url: string) {
        super(`Error: ${status} for endpoint ${url}`);
    }
}

export class IssueService {
    private getJiraUrl(boardNumber: string, status: string = "Integrating"): string {
        const url = `${JIRA_BASE}/rest/agile/1.0/board/${boardNumber}/issue?jql=status%20=%20%27${status}%27`;
        return url;
    }

    private getJiraToken(): string {
        const userSettings = fetchSettings();
        const rawToken: string = `${userSettings.Email}:${userSettings.ApiKey}`;
        const token = btoa(rawToken);

        return token;
    }

    // GET only: through the proxy, Jira rejects browser POSTs with "XSRF check failed".
    private request(jiraUrl: string, extraHeaders: Record<string, string> = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = CORS_PROXY + jiraUrl;
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Authorization", `Basic ${this.getJiraToken()}`);
            xhr.setRequestHeader("Content-Type", "application/json");
            for (const [name, value] of Object.entries(extraHeaders)) {
                xhr.setRequestHeader(name, value);
            }
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const responseRaw: string = xhr.response;
                    if (responseRaw?.length > 0) {
                        try {
                            const response = JSON.parse(xhr.response);
                            resolve(response);
                        }
                        catch(ex) {
                            reject(new Error(`Error parsing response from ${url}.`));
                        }
                    }
                    else {
                        reject(new Error(`Empty response from ${url}.`));
                    }
                } else {
                    reject(new JiraRequestError(xhr.status, url));
                }
            };

            xhr.onerror = () => {
                reject(new JiraRequestError(xhr.status, url));
            }
            xhr.send();
        });
    }

    private fetchIssues(boardNumber: string, status: string): any {
        return this.request(this.getJiraUrl(boardNumber, status), {
            'Access-Control-Allow-Origin': '*',
            "Access-Control-Allow-Methods": "OPTIONS, GET",
        });
    }

    async GetIssues(boardNumber: string, status: string): Promise<JiraTicket[]> {

        const jiraIssues = await this.fetchIssues(boardNumber, status);

        const issueList = new Array<JiraTicket>();

        jiraIssues.issues.forEach( (issue: any) => {
            const ticketNumber = issue.key;
            const codeBase = issue.fields.customfield_10130?.value ?? "";
            const priorityText = issue.fields.priority?.name ?? "Default";
            const isPbi = false;
            const isSev = priorityText.toLowerCase().indexOf("sev") > -1;
            const summary = issue.fields.summary;
            const issueType = issue.fields.issuetype.name;
            const labels = issue.fields.labels;
            const team = issue.fields.customfield_10001?.name ?? "";

            const ticket = new JiraTicket(ticketNumber, codeBase, priorityText, isPbi, isSev, issueType, summary, labels, team);
            issueList.push(ticket);

            // Links live in the in-memory store, not on the ticket, so they're never saved to Cosmos.
            // Only record them when Jira actually returned the field; otherwise leave them "not loaded".
            if (Array.isArray(issue.fields.issuelinks)) {
                setLinks(ticketNumber, parseIssueLinks(issue.fields.issuelinks));
            }
        });

        return issueList;
    }

    /**
     * Current blocker/dependency links for the given tickets, one GET per ticket (a few at a time).
     * Results are keyed by the ticket number asked for, so a ticket Jira has since moved to a new key
     * still matches its card. Tickets Jira reports as missing (404, which also covers tickets you
     * can't see) are left out. Any other failure (403 lockout, network, expired login, proxy down)
     * stops the remaining requests and rejects, so the caller can clear the pills and log the error.
     *
     * `isCurrent` lets the caller cancel: once it returns false (a newer refresh started), no more
     * requests are sent and whatever was fetched so far is returned for the caller to discard.
     */
    async GetIssueLinks(ticketKeys: string[], isCurrent: () => boolean = () => true): Promise<Map<string, IssueLink[]>> {
        const keys = [...new Set(ticketKeys)];
        const result = new Map<string, IssueLink[]>();
        let next = 0;
        let stopped = false; // set on failure or cancel, so every worker stops taking new tickets

        const worker = async () => {
            while (!stopped && next < keys.length) {
                if (!isCurrent()) {
                    stopped = true;
                    return;
                }
                const key = keys[next++];
                try {
                    const issue = await this.request(`${JIRA_BASE}/rest/api/3/issue/${encodeURIComponent(key)}?fields=issuelinks`);
                    if (Array.isArray(issue?.fields?.issuelinks)) {
                        result.set(key, parseIssueLinks(issue.fields.issuelinks));
                    }
                }
                catch (error) {
                    const missing = error instanceof JiraRequestError && error.status === 404;
                    if (!missing) {
                        stopped = true;
                        throw error;
                    }
                }
            }
        };

        await Promise.all(Array.from({ length: Math.min(LINK_FETCH_CONCURRENCY, keys.length) }, worker));
        return result;
    }
}
