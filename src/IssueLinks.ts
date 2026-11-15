import { shallowReactive } from "vue";

// Tickets a ticket is waiting on ("is blocked by" / "depends on"), read live from Jira.
// Kept in memory only and never written to Cosmos, so a ticket's frozen snapshot in a
// version can't show a stale "blocked" state.

export type LinkRelation = "is blocked by" | "depends on";
export type StatusCategory = "new" | "indeterminate" | "done";

export interface IssueLink {
    Key: string;
    Summary: string;
    StatusName: string;
    StatusCategory: StatusCategory;
    Relation: LinkRelation;
}

// Jira link type name -> relation. Only the inward side is read: there, the *other* ticket is the
// one being waited on. Matched on the type name, not Jira's phrases ("is required for" has a
// trailing tab in Jira's data).
const RELATIONS: Record<string, LinkRelation> = {
    "Blocks": "is blocked by",
    "Dependency": "depends on",
};

const toStatusCategory = (key: string | undefined): StatusCategory =>
    key === "done" || key === "indeterminate" ? key : "new";

/** Turns Jira's raw `fields.issuelinks` into the tickets this one is waiting on. Other links are ignored. */
export const parseIssueLinks = (rawLinks: any[] | undefined | null): IssueLink[] => {
    const links: IssueLink[] = [];

    for (const raw of rawLinks ?? []) {
        const relation = RELATIONS[raw?.type?.name];
        const other = raw?.inwardIssue;
        if (!relation || !other?.key) continue;

        links.push({
            Key: other.key,
            Summary: other.fields?.summary ?? "",
            StatusName: other.fields?.status?.name ?? "",
            StatusCategory: toStatusCategory(other.fields?.status?.statusCategory?.key),
            Relation: relation,
        });
    }

    return links;
};

/** Open (not done) links of one relation. */
export const openLinks = (links: IssueLink[], relation: LinkRelation) =>
    links.filter(l => l.Relation === relation && l.StatusCategory !== "done");

// ---- In-memory store shared by both columns -------------------------------------------
// Shallow: a ticket's list is always replaced whole, so only the map itself needs to be reactive.

const linksByTicket = shallowReactive(new Map<string, IssueLink[]>());

export const setLinks = (ticketKey: string, links: IssueLink[]) => {
    linksByTicket.set(ticketKey, links);
};

export const getLinks = (ticketKey: string): IssueLink[] => linksByTicket.get(ticketKey) ?? [];

export const deleteLinks = (ticketKey: string) => {
    linksByTicket.delete(ticketKey);
};
