import { JiraTicket } from "./JiraTicket";

export class IssueService {

    private fetchIssues(): any {
        return new Promise((resolve, reject) => {
            const rawToken = "sheibeck@dealeron.com:ATATT3xFfGF0xyPqPadSpUScPrIsbYlZBlO20KQTLswiomJv5sF5oPD9aRQD_U5KCCGvYKiDcyPXijCnm2V4p6gLZerQVqiJ0czENxXhx5f50Bo_1HPF3sw6zBEO8bYDREc1ZWDfevYogn2vmvlc9e5RAbFoTQdG4yCpATm47H1-0JQ_wwwXeEo=9878B9F9";
            const token = btoa(rawToken);
            const jiraUrl = "https://dealeron.atlassian.net/rest/agile/1.0/board/94/issue?jql=status%20=%20%27Integrating%27";
            const url = 'https://corsproxy.io/?' + encodeURIComponent(jiraUrl);
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Authorization", `Basic ${token}`);
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

    async GetIssues(): Promise<JiraTicket[]> {
       
        const jiraIssues = await this.fetchIssues();

        const issueList = new Array<JiraTicket>();

        jiraIssues.issues.forEach( (issue: any) => {
            const ticketNumber = issue.id;
            const codeBase = issue.fields.customfield_10130?.value ?? "";  
            const priorityText = issue.fields.priority?.name ?? "Default";
            const isPbi = false;
            const isSev = priorityText.toLowerCase().indexOf("sev") > -1;
            const summary = issue.fields.summary;
                
            const ticket = new JiraTicket(ticketNumber, codeBase, priorityText, isPbi, isSev, summary)
            issueList.push(ticket);        
        });

        return issueList;
    }
}