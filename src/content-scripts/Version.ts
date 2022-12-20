import { JiraTicket } from "./JiraTicket";

export class Version {
    Number: string;
    CodeBase: string;
    Issues = new Array<JiraTicket>();
    Released: boolean = false;
    ReleaseDate: string = "";    
    IsBuilt: boolean = false;
    PI: string = "";

    constructor(number, codebase) {
        this.Number = number;
        this.CodeBase = codebase;
    }

    public IsSev(): boolean {
        const sevIssues = this.Issues.find( i => i.IsSev);
        return sevIssues != null;
    }
}