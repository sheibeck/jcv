import { JiraTicket } from "./JiraTicket";

export class Version {
    id: string | undefined;
    Team: string;
    Number: string;
    CodeBase: string;
    Issues = new Array<JiraTicket>();
    Released: boolean = false;
    ReleaseDate: string = "";    
    IsBuilt: boolean = false;
    IsPlanned: boolean = false;
    PI: string = "";

    constructor(team: string, number: string, codebase: string) {
        this.Team = team;
        this.Number = number;
        this.CodeBase = codebase;
    }

    public IsSev(): boolean {
        const sevIssues = this.Issues.find( i => i.IsSev);
        return sevIssues != null;
    }
}