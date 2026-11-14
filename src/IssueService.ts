import { JiraTicket } from "./JiraTicket";
import { fetchSettings, type UserSettings } from "./UserSettings";
import { parseIssueLinks, setLinks, type IssueLink } from "./IssueLinks";

// running a custom cors proxy on heroku.
const CORS_PROXY = 'https://jvc-cors-proxy-7bc908c62bc1.herokuapp.com/';
const JIRA_BASE = 'https://dealeron.atlassian.net';
const BULK_FETCH_LIMIT = 100; // Jira's max issues per bulkfetch request

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

    private request(method: "GET" | "POST", jiraUrl: string, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = CORS_PROXY + jiraUrl;
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
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
                    reject(`Error: ${xhr.status} for endpoint ${url}`);
                }
            };

            xhr.onerror = () => {
                reject((`Error: ${xhr.status} for endpoint ${url}`));
            }
            xhr.send(body === undefined ? null : JSON.stringify(body));
        });
    }

    private fetchIssues(boardNumber: string, status: string): any {
        return this.request("GET", this.getJiraUrl(boardNumber, status), undefined, {
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
     * Fetches the given fields for many tickets at once. Tickets Jira can't return
     * (deleted, moved, no access) come back in `issueErrors` and are simply left out.
     */
    private async bulkFetch(ticketKeys: string[], fields: string[]): Promise<any[]> {
        const keys = [...new Set(ticketKeys)];
        const issues: any[] = [];

        for (let i = 0; i < keys.length; i += BULK_FETCH_LIMIT) {
            const response = await this.request(
                "POST",
                `${JIRA_BASE}/rest/api/3/issue/bulkfetch`,
                { issueIdsOrKeys: keys.slice(i, i + BULK_FETCH_LIMIT), fields },
                { "X-Atlassian-Token": "no-check" },
            );
            issues.push(...(response?.issues ?? []));
        }

        return issues;
    }

    /** Current blocker/dependency links for the given tickets. */
    async GetIssueLinks(ticketKeys: string[]): Promise<Map<string, IssueLink[]>> {
        const result = new Map<string, IssueLink[]>();

        for (const issue of await this.bulkFetch(ticketKeys, ["issuelinks"])) {
            if (issue?.key && Array.isArray(issue.fields?.issuelinks)) {
                result.set(issue.key, parseIssueLinks(issue.fields.issuelinks));
            }
        }

        return result;
    }
}
