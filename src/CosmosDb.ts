import { CosmosClient } from "@azure/cosmos";
import type { Version } from "./Version";

const endpoint = 'https://corsproxy.io/?' + encodeURIComponent("https://c2cjiraversioner.documents.azure.com:443/");
const key = import.meta.env.VUE_APP_COSMOSDB_KEY;

const client = new CosmosClient("AccountEndpoint=https://c2cjiraversioner.documents.azure.com:443/;AccountKey=9AVSNKSKGQDHlilnc8OnGoJ0GLk8VMAyvM6S23WBAhrGhZ5Xo7zeJLRNIZX257ihAE8W6YiqnlWYACDbYS5Hsg==;");
/*const client = new CosmosClient({ endpoint, key, connectionPolicy: {
    enableEndpointDiscovery: false
}});
*/
const dbname = "versions";
const containerName = "versions";
const { database } = await client.databases.createIfNotExists({ id: dbname });
const { container } = await database.containers.createIfNotExists({ id: containerName });

const fetchAllItems = async (includeReleased?: boolean) => {
    let query = "SELECT * from c WHERE c.Released = false ORDERBY c.Number asc LIMIT 20";

    if (includeReleased) {
        query = "SELECT * from c WHERE ORDERBY c.Number asc LIMIT 20";
    }

    const versions: any = await container.items
        .query(query)
        .fetchAll();

    var versionList = new Array<Version>();

    versions.forEach((version: any) => {
        versions.push(version as Version);
    });

    return versionList;
}

const saveItem = async (version: Version) => {
    const item = JSON.parse(JSON.stringify(version));
    await container.items.create(item);
}

const deleteItem = async (version: Version) => {
    await container.item(version.Id).delete();
}

const saveAllItems = async(versions: Array<Version>) => {
    versions.forEach( async (version) => {
        saveItem(version);
    })
}

export { fetchAllItems, saveItem, deleteItem, saveAllItems };