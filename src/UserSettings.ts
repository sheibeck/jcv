import { hasValue } from "@/Utils";

export class UserSettings {
    Email: string = "";
    ApiKey: string = "";
    TeamName: string = "";
    BoardNumber: string = "";
    SlackGroup: string = "";
    FirstPiStartDate: string = "";
    SlackGroups: { [key: string]: string };

    constructor() {
        this.SlackGroups = {
            "DSCO": "@dsco-integrators",
            "LEA": "@lea-integration",
            "OMNI": "@omni-integration",
            "PIT": "@pit-integration",
            "PLG": "@plg-integrators",
            "PPE": "@ppe-integration",
            "SPEC": "@spec-integration",
            "SPR": "@spr-integrators",
            "TAG": "@tag-integration",
            "TNT": "@tnt-integration",
        };
    }
}

export const fetchSettings = () => {
    const settingsJson = localStorage.getItem('jcv-settings');
    const userSettings = new UserSettings();

    if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        userSettings.Email = settings.Email;
        userSettings.TeamName = settings.TeamName.toUpperCase();
        userSettings.BoardNumber = settings.BoardNumber;
        userSettings.SlackGroup = settings.SlackGroup;
        userSettings.ApiKey = settings.ApiKey;
        if(settings.FirstPiStartDate){
            const [year, month, day] = settings.FirstPiStartDate.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            userSettings.FirstPiStartDate = date.toISOString().split("T")[0];
        }
        if(settings.SlackGroups && Object.keys(settings.SlackGroups).length > 0) {
            userSettings.SlackGroups = settings.SlackGroups;
        }
    }
    return userSettings;
}

export const saveSettings = (userSettings: UserSettings)  => {
    localStorage.setItem('jcv-settings', JSON.stringify(userSettings));
}

export const isSettingsValid = (userSettings: UserSettings) => {
    if (!hasValue(userSettings.TeamName)) return false;
    if (!hasValue(userSettings.BoardNumber)) return false;
    if (!hasValue(userSettings.ApiKey)) return false;
    if (!hasValue(userSettings.Email)) return false;
    
    return true;
}

