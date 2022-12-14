import { Version } from "./Version";

export class Database {
    Name: string;

    constructor(name) {
        this.Name = name;
    }

    save(value) {
        const json = JSON.stringify(value);
        window.localStorage.setItem(this.Name, json);
    }

    fetchAll() : Array<Version> {
        const versions = window.localStorage.getItem(this.Name);
        if (versions) {
            const json = JSON.parse(versions);

            if (json) {
                return json as Array<Version>;
            }
        }
        
        return new Array<Version>();
    }
}