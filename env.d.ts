/// <reference types="vite/client" />
interface ImportMetaEnv {
    VITE_COSMOSDB_CS: string;
    VITE_JIRA_TOKEN: string;
}


interface ImportMeta {
    readonly env: ImportMetaEnv
}