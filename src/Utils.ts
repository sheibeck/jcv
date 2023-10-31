import type { JiraTicket } from "@/JiraTicket";

export const isRegression = (issue: JiraTicket) => {
    return issue.IssueType === "Regression";
}

export function hasValue(value: string) {
    return value?.length > 0;
}
  
export const getIssueUrl = (issueNumber: string) => {
    return `https://dealeron.atlassian.net/browse/${issueNumber}`;
}