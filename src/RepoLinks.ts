// Links to codebase repos in Azure DevOps. For most repos the project is the first 4 letters
// of the codebase key (VHCLIAA → VHCL). PROJECT_EXCEPTIONS lists the ones that aren't.

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
