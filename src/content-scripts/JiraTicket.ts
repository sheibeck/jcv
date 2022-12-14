export class JiraTicket {
    Number: string;    
    CodeBase: string;
    IsPbi: boolean;
    IsSev: boolean;
    Priority: string;

    constructor(number, codeBase, priorityText, isPbi, isSev) {
      this.Number = number;      
      this.CodeBase = codeBase;
      this.Priority = priorityText;
      this.IsPbi = isPbi;
      this.IsSev = isSev;
    }
}
  