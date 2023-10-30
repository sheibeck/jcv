import { JiraTicket } from "./JiraTicket";

export class Version {
    id: string | undefined;
    Team: string;
    Major: number = 0;
    Minor: number = 0;
    Revision: number = 0;
    Number: string;
    FullVersion: string = "";
    CodeBase: string;
    Issues = new Array<JiraTicket>();
    Released: boolean = false;
    ReleaseDate: string = "";    
    IsBuilt: boolean = false;
    IsPlanned: boolean = false;

    constructor(team: string, number: string, codebase: string) {
        this.Team = team;
        this.Number = number;
        this.CodeBase = codebase;

        this.SetDetails();
    }

    IsSev(): boolean {
        const sevIssues = this.Issues.find( i => i.IsSev);
        return sevIssues != null;
    }

    SetDetails() : void {
        const versionParts = this.Number.split('.');
        this.Major = parseInt(versionParts[0]);
        this.Minor = parseInt(versionParts[1]);
        this.Revision = parseInt(versionParts[2]);
        this.FullVersion = `${this.CodeBase} ${this.Number}`;
    }
}