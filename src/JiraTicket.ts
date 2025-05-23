export class JiraTicket {
    Number: string;    
    CodeBase: string;
    IsPbi: boolean;
    IsSev: boolean;
    Priority: string;
    Summary: string;
    IssueType: string;
    Labels: string[];
    Team: string;

    constructor(number: string, codeBase: string, priorityText: string, isPbi: boolean, isSev: boolean, issueType: string, summary?: string, labels?: string[], team?: string) {
      this.Number = number;      
      this.CodeBase = codeBase;
      this.Priority = priorityText;
      this.IsPbi = isPbi;
      this.IsSev = isSev;
      this.IssueType = issueType;
      this.Summary = summary ?? "";
      this.Labels = labels ?? [];
      this.Team = team ?? "";
    }
}
  