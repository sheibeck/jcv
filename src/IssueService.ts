import { JiraTicket } from "./JiraTicket";
import { fetchSettings, type UserSettings } from "./UserSettings";

export class IssueService {
    private getJiraUrl(boardNumber: string): string {
        const url = `https://dealeron.atlassian.net/rest/agile/1.0/board/${boardNumber}/issue?jql=status%20=%20%27Integrating%27`;
        return url;
    }

    private getJiraToken(): string {
        const userSettings = fetchSettings();
        const rawToken: string = `${userSettings.Email}:${userSettings.ApiKey}`;
        const token = btoa(rawToken); 

        return token;
    }

    private fetchIssues(boardNumber: string): any {
        return new Promise((resolve, reject) => {
            
            // running a custom cors proxy on heroku.
            const url = 'https://jvc-cors-proxy-7bc908c62bc1.herokuapp.com/' + this.getJiraUrl(boardNumber);
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Authorization", `Basic ${this.getJiraToken()}`);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
            xhr.setRequestHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
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
                        reject(new Error(`Vehicles from ${url} could not be found.`));
                    }
                } else {
                    reject(`Error: ${xhr.status} for endpoint ${url}`);
                }
            };

            xhr.onerror = () => {
                reject((`Error: ${xhr.status} for endpoint ${url}`));      
            }
            xhr.send();
        });
    }

    async GetIssues(boardNumber: string): Promise<JiraTicket[]> {
       
        const jiraIssues = await this.fetchIssues(boardNumber);

        const issueList = new Array<JiraTicket>();

        jiraIssues.issues.forEach( (issue: any) => {
            const ticketNumber = issue.key;
            const codeBase = issue.fields.customfield_10130?.value ?? "";  
            const priorityText = issue.fields.priority?.name ?? "Default";
            const isPbi = false;
            const isSev = priorityText.toLowerCase().indexOf("sev") > -1;
            const summary = issue.fields.summary;
            const issueType = issue.fields.issuetype.name;
                
            const ticket = new JiraTicket(ticketNumber, codeBase, priorityText, isPbi, isSev, issueType, summary)
            issueList.push(ticket);        
        });

        return issueList;
    }
}