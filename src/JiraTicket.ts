export class JiraTicket {
    Number: string;    
    CodeBase: string;
    IsPbi: boolean;
    IsSev: boolean;
    Priority: string;
    Summary: string;

    constructor(number: string, codeBase: string, priorityText: string, isPbi: boolean, isSev: boolean, summary?: string) {
      this.Number = number;      
      this.CodeBase = codeBase;
      this.Priority = priorityText;
      this.IsPbi = isPbi;
      this.IsSev = isSev;
      this.Summary = summary ?? "";
    }
}
  