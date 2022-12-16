export class JiraTicket {
    Number: string;    
    CodeBase: string;
    IsPbi: boolean;
    IsSev: boolean;
    Priority: string;
    Summary: string;

    constructor(number, codeBase, priorityText, isPbi, isSev, summary?) {
      this.Number = number;      
      this.CodeBase = codeBase;
      this.Priority = priorityText;
      this.IsPbi = isPbi;
      this.IsSev = isSev;
      this.Summary = summary ?? "";
    }
}
  