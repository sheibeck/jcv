import { hasValue } from "@/Utils";

export class UserSettings {
    Email: string = "";
    ApiKey: string = "";
    TeamName: string = "";
    BoardNumber: string = "";
    SlackGroup: string = "";

    constructor() {
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

