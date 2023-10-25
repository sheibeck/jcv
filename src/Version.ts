import { JiraTicket } from "./JiraTicket";

export class Version {
    id: string | undefined;
    Number: string;
    CodeBase: string;
    Issues = new Array<JiraTicket>();
    Released: boolean = false;
    ReleaseDate: string = "";    
    IsBuilt: boolean = false;
    IsPlanned: boolean = false;
    PI: string = "";

    constructor(number: string, codebase: string) {
        this.Number = number;
        this.CodeBase = codebase;
    }

    public IsSev(): boolean {
        const sevIssues = this.Issues.find( i => i.IsSev);
        return sevIssues != null;
    }
}