import { JiraTicket } from "./JiraTicket";

export class CodeBase {
    Name: string;
    Issues = new Array<JiraTicket>();

    constructor(name) {
      this.Name = name;      
    }

    AddIssue(issue) {
      if (!this.Issues.find( i => i.Number == issue.Number)) {
        this.Issues.push(issue);
      }
    }
}
  