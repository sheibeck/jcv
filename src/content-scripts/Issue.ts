import { JiraTicket } from "./JiraTicket";

export class Issue {

    static GetIssues() : Array<JiraTicket> {          
        const integrationColumnId = document.querySelector("[title='Integrating']")?.getAttribute("data-id");
        const swimLanes = document.querySelectorAll(`[data-column-id="${integrationColumnId}"]`);
        const issueList = new Array<JiraTicket>();

        swimLanes.forEach( (swimLane) => {    
            const issues = swimLane?.querySelectorAll(".ghx-issue") ?? [];

            issues.forEach( (issue) => {   
                const ticketNumber = issue.getAttribute("data-issue-key");
                const extraFields = issue.querySelector(".ghx-extra-fields");
                let isPbi = false;
                
                if (issue.closest(".ghx-swimlane")?.classList.contains("ghx-first")) {
                    isPbi = true;
                }

                let codeBase = "";            
                const codeBaseRows = extraFields?.querySelectorAll(".ghx-row"); 
                if (codeBaseRows) {        
                    const codeBaseText = codeBaseRows[1].querySelector(".ghx-extra-field");
                    if (codeBaseText) {
                    codeBase = codeBaseText.getAttribute("data-tooltip") ?? "";
                    codeBase = codeBase.replace("CodebaseKey: ", "");
                    }
                }
                                        
                let isSev = false;
                let priorityText = "Default";
                const statFields = issue.querySelector(".ghx-stat-fields");
                const statRows = statFields?.querySelectorAll(".ghx-row"); 
                if (statRows) {
                    const priority = statRows[0].querySelectorAll(".ghx-field")[1];
                    priorityText = (priority?.getAttribute("data-tooltip") ?? "").replace(" priority", "");
                    if (priorityText.indexOf("Default") === -1) {
                        isSev = true;
                    }                
                }
                    
                if (ticketNumber) {        
                    const ticket = new JiraTicket(ticketNumber, codeBase, priorityText, isPbi, isSev)
                    issueList.push(ticket);
                }
            });    
        });

        return issueList;
    }
}