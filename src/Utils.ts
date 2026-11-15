import type { JiraTicket } from "@/JiraTicket";

export const isRegression = (issue: JiraTicket) => {
    return issue.IssueType === "Regression";
}

export function hasValue(value: string | undefined | null): boolean {
    return value != null && value.length > 0;
}
  
export const JIRA_BASE_URL = "https://dealeron.atlassian.net";

export const getIssueUrl = (issueNumber: string) => {
    return `${JIRA_BASE_URL}/browse/${issueNumber}`;
}