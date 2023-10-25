import { JiraTicket } from "./JiraTicket";

export class CodeBase {
    Name: string;
    Issues = new Array<JiraTicket>();

    constructor(name: string) {
      this.Name = name;      
    }

    AddIssue(issue: any) {
      if (!this.Issues.find( i => i.Number == issue.Number)) {
        this.Issues.push(issue);
      }
    }
}
  