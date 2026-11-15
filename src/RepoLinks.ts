// Links to codebase repos in Azure DevOps.
//
// Repos live in per-area Azure DevOps projects, and the project is part of every repo URL
// (…/dealeron/_git/<repo> without a project is a 404). For most repos the project is the first
// 4 letters of the codebase key (VHCLIAA → VHCL). PROJECT_EXCEPTIONS lists the ones that aren't.
//
// Built 2026-11-14 from the live list of all repos in the org, leaving out the ARCHIVE, MOCK and
// TEST projects. To refresh it, list each project's repos with the Azure CLI (azure-devops extension):
//   az devops project list --organization https://dev.azure.com/dealeron --query "value[].name" -o tsv
//   az repos list --organization https://dev.azure.com/dealeron --project <project> --query "[].name" -o tsv
// and add any codebase whose project isn't its first 4 letters. Check every all-caps repo name,
// not just 7-character ones: 6-character codebases like ARCSHA and INVSHA exist too.

const ADO_ORG_URL = "https://dev.azure.com/dealeron";

const PROJECT_EXCEPTIONS: Record<string, string> = {
    // ARCH
    BLOGSAA: "ARCH", LDATSHA: "ARCH", DOCSOTA: "ARCH", ARCSHA: "ARCH",
    TMPTBAA: "ARCH", TMPTBAB: "ARCH", TMPTCPY: "ARCH", TMPTIAB: "ARCH",
    TMPTMSG: "ARCH", TMPTOTA: "ARCH", TMPTSAA: "ARCH", TMPTSHA: "ARCH",
    // SITE
    LANGSHA: "SITE", ASWAUTB: "SITE",
    // LEAD
    DLVRBAA: "LEAD", DLVRIAA: "LEAD",
    // INV
    PRLGBAA: "INV", PRLGIAA: "INV", PRLGSHA: "INV", INVTOTA: "INV", INVSHA: "INV",
    // Others
    COFOBAA: "FORM",
    BAMSBAA: "BANR",
    OEMPBAA: "OEMS",
    INFEXPT: "RPRT",
};

/** Azure DevOps project that holds a codebase's repo. */
export const getRepoProject = (codebase: string): string => {
    const key = codebase.trim().toUpperCase();
    return PROJECT_EXCEPTIONS[key] ?? key.slice(0, 4);
};

/** The repo's main page. */
export const getRepoUrl = (codebase: string) =>
    `${ADO_ORG_URL}/${getRepoProject(codebase)}/_git/${encodeURIComponent(codebase.trim())}`;
