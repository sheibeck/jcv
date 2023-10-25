import { CosmosClient } from "@azure/cosmos";
import type { Version } from "./Version";

const connectionString = import.meta.env.VITE_COSMOSDB_CS;
const client = new CosmosClient(`${connectionString}`);

const dbname = "versions";
const containerName = "versions";
const { database } = await client.databases.createIfNotExists({ id: dbname });
const { container } = await database.containers.createIfNotExists({ id: containerName });

const fetchAllItems = async (includeReleased?: boolean) => {
    let query = "SELECT TOP 20 * from c WHERE c.Released = false ORDER BY c.Number asc";

    if (includeReleased) {
        query = "SELECT TOP 20 * from c WHERE ORDER BY c.Number asc LIMIT 20";
    }

    const versions: any = await container.items
        .query(query)
        .fetchAll();

    var versionList = new Array<Version>();

    versions.resources.forEach((version: any) => {
        versionList.push(version as Version);
    });

    return versionList;
}

const saveItem = async (version: Version) => {
    const item = JSON.parse(JSON.stringify(version));
    await container.items.create(item);
}

const deleteItem = async (version: Version) => {
    const versions: any = await container.items
        .query(`SELECT TOP * from c WHERE Id = '${version.Id}'`)
        .fetchAll();
    
    versions.resources.forEach((version: any) => {
         container.item(version.id).delete(); 
    });
}

const saveAllItems = async(versions: Array<Version>) => {
    versions.forEach( async (version) => {
        saveItem(version);
    })
}

export { fetchAllItems, saveItem, deleteItem, saveAllItems };