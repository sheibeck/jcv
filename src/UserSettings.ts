export class UserSettings {
    TeamName: string = "";
    BoardNumber: string = "";
    SlackGroup: string = "";

    constructor() {
    }

    fetchSettings() {
        const settingsJson = localStorage.getItem('jcv-settings');

        if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            this.TeamName = settings.TeamName;
            this.BoardNumber = settings.BoardNumber;
            this.SlackGroup = settings.SlackGroup;
        }
    }
    
    public saveSettings() {
        localStorage.setItem('jcv-settings', JSON.stringify(this));
    }

    public isValid() {
        if (this.TeamName.length === 0) return false;
        if (this.BoardNumber.length === 0) return false;
        
        return true;
    }
}

