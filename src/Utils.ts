import type { JiraTicket } from "@/JiraTicket";

export const isRegression = (issue: JiraTicket) => {
    return issue.IssueType === "Regression";
}