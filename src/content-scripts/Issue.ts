import { JiraTicket } from "./JiraTicket";

export class Issue {
    static GetIssues() : Array<JiraTicket> {          
        const integrationColumnId = document.querySelector("[title='Integrating']")?.getAttribute("data-id");
        const swimLanes = document.querySelectorAll(`[data-column-id="${integrationColumnId}"]`);
        const issueList = new Array<JiraTicket>();

        swimLanes.forEach( (swimLane) => {    
            const issues = swimLane?.querySelectorAll(".ghx-issue") ?? [];

            issues.forEach( (issue) => {   
                let isPbi = false;                                           
                let isSev = false;
                let codeBase = "";  
                let priorityText = "Default";

                const ticketNumber = issue.getAttribute("data-issue-key");
                const extraFields = issue.querySelector(".ghx-extra-fields");
                
                //summary
                const summary = issue.querySelector(".ghx-summary");
                const summaryText = summary?.textContent;

                //priority
                const statFields = issue.querySelector(".ghx-stat-fields");
                const statRows = statFields?.querySelectorAll(".ghx-row"); 
                if (statRows) {
                    //if this isn't a sub-task then skip it. we don't want stories in here, just workable tickets
                    const taskType = statRows[0].querySelectorAll(".ghx-field")[0];
                    const taskTypeText =  (taskType?.getAttribute("data-tooltip") ?? "");
                    if (taskTypeText !== "Sub-task" && taskTypeText !== "Regression") {
                        return;
                    }

                    //fetch the priority
                    const priority = statRows[0].querySelectorAll(".ghx-field")[1];
                    priorityText = (priority?.getAttribute("data-tooltip") ?? "").replace(" priority", "");
                    if (priorityText.indexOf("Default") === -1) {
                        isSev = true;
                    }
                }
                
                
                //swimlane for pbi/sev issues
                const swimLaneLabel = issue.closest(".ghx-swimlane")?.querySelector(".ghx-swimlane-header")?.getAttribute("aria-label");
                if (swimLaneLabel?.includes("PBI")) {
                    isPbi = true;
                }

                //codebase key
                const codeBaseRows = extraFields?.querySelectorAll(".ghx-row"); 
                if (codeBaseRows) {        
                    const codeBaseText = codeBaseRows[1].querySelector(".ghx-extra-field");
                    if (codeBaseText) {
                    codeBase = codeBaseText.getAttribute("data-tooltip") ?? "";
                    codeBase = codeBase.replace("CodebaseKey: ", "");
                    }
                }             
                    
                if (ticketNumber) {        
                    const ticket = new JiraTicket(ticketNumber, codeBase, priorityText, isPbi, isSev, summaryText)
                    issueList.push(ticket);
                }
            });    
        });

        return issueList;
    }

    static GetBoardName() : String {        
        const boardNameElem = document.getElementById("ghx-board-name");
        if (boardNameElem) {
            return boardNameElem.innerText;            
        }
        else {
            return "";
        }
    }
  
}