import { CosmosClient } from "@azure/cosmos";
import type { Version } from "./Version";

const connectionString = import.meta.env.VITE_COSMOSDB_CS;
const client = new CosmosClient(`${connectionString}`);

const dbname = "versions";
const containerName = "versions";
const { database } = await client.databases.createIfNotExists({ id: dbname });
const { container } = await database.containers.createIfNotExists({ id: containerName });

const fetchAllItems = async (team: string, includeReleased?: boolean, searchIssue?: string) => {
    // adding 1=1 allows us to add AND clauses without checking if the first one exists
    let query = `SELECT TOP 15 * from c WHERE c.Team = '${team}' AND 1=1`;

    if (searchIssue) {
        query += ` AND c.FullVersion Like '%${searchIssue}%'`;
    }

    if (!includeReleased) {
        query += ` AND c.Released = false`;
    }

    query += ` ORDER BY c.Major desc, c.Minor desc, c.Revision desc`;

    const { resources } = await container.items
        .query(query)
        .fetchAll();

    var versionList = new Array<Version>();

    for(const version of resources) {
        versionList.push(version as Version);
    };

    return versionList;
}

const saveItem = async (version: Version) => {
    //prep the item for upsert
    const item = JSON.parse(JSON.stringify(version));

    if (version.id) {
        const { resource: docToUpdate } = await container.item(version.id, version.id).read();

        if (docToUpdate) {
            await container
                .item(version.id, version.id)
                .replace(item);
        }
    }
    else {
        await container.items.create(item);
    }

    return item.id;
}

const deleteItem = async (version: Version) => {
    if (version.id) {
        const { statusCode } = await container.item(version.id, version.id).delete();
    };
}

const saveAllItems = async(versions: Array<Version>) => {
    versions.forEach( async (version: Version) => {
        const id = await saveItem(version);
        version.id = id;
    })
}

export { fetchAllItems, saveItem, deleteItem, saveAllItems };