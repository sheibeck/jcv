import { JiraTicket } from "./JiraTicket";

export class Version {
    Number: string;
    CodeBase: string;
    Issues = new Array<JiraTicket>();
    Released: boolean = false;
    ReleaseDate: string = "";    
    IsPlanned: boolean = this.isPlanned();
    PI: string = "";

    constructor(number, codebase) {
        this.Number = number;
        this.CodeBase = codebase;
    }

    public isPlanned(): boolean {
        const sevIssues = this.Issues.find( i => i.IsSev);
        return sevIssues != null;
    }
}