import { reactive, ref } from "vue";

// Blocker / dependency links between Jira issues, as seen from one ticket.
// This data is always fetched live from Jira and kept in memory only. It is never
// written to Cosmos, so a ticket's frozen snapshot in a version can't show a stale
// "blocked" state.

export type LinkDirection = "upstream" | "downstream"; // upstream = this ticket is waiting on the other one
export type LinkRelation = "is blocked by" | "depends on" | "blocks" | "is required for";
export type StatusCategory = "new" | "indeterminate" | "done";

export interface IssueLink {
    Key: string;
    Summary: string;
    IssueType: string;
    StatusName: string;
    StatusCategory: StatusCategory;
    Relation: LinkRelation;
    Direction: LinkDirection;
    Resolved: boolean;
}

// Link type name -> relation, depending on which side the *other* issue is on.
// Matched on the type name, never the inward/outward phrases: Jira's Dependency
// outward phrase is "is required for\t" (with a trailing tab).
const RELATIONS: Record<string, { inward: LinkRelation; outward: LinkRelation }> = {
    "Blocks": { inward: "is blocked by", outward: "blocks" },
    "Dependency": { inward: "depends on", outward: "is required for" },
};

const toStatusCategory = (key: string | undefined): StatusCategory =>
    key === "done" || key === "indeterminate" ? key : "new";

/** Turns Jira's raw `fields.issuelinks` array into blocker/dependency links. Other link types are ignored. */
export const parseIssueLinks = (rawLinks: any[] | undefined | null): IssueLink[] => {
    const links: IssueLink[] = [];

    for (const raw of rawLinks ?? []) {
        const relations = RELATIONS[raw?.type?.name];
        const other = raw?.inwardIssue ?? raw?.outwardIssue;
        if (!relations || !other?.key) continue;

        const isInward = !!raw.inwardIssue;
        const relation = isInward ? relations.inward : relations.outward;
        const statusCategory = toStatusCategory(other.fields?.status?.statusCategory?.key);

        links.push({
            Key: other.key,
            Summary: other.fields?.summary ?? "",
            IssueType: other.fields?.issuetype?.name ?? "",
            StatusName: other.fields?.status?.name ?? "",
            StatusCategory: statusCategory,
            Relation: relation,
            Direction: isInward ? "upstream" : "downstream",
            Resolved: statusCategory === "done",
        });
    }

    return links;
};

/** Open (not done) links of one relation, e.g. "is blocked by" or "depends on". */
export const openLinks = (links: IssueLink[], relation: LinkRelation) =>
    links.filter(l => l.Relation === relation && !l.Resolved);

// ---- In-memory store shared by both columns -------------------------------------------

const linksByTicket = reactive(new Map<string, IssueLink[]>());

export const setLinks = (ticketKey: string, links: IssueLink[]) => {
    linksByTicket.set(ticketKey, links);
};

/** undefined = not loaded (show nothing); [] = loaded, no blocker/dependency links. */
export const getLinks = (ticketKey: string): IssueLink[] | undefined => linksByTicket.get(ticketKey);

export const deleteLinks = (ticketKey: string) => {
    linksByTicket.delete(ticketKey);
};

/** True while a card is being dragged, so link tooltips stay out of the way. */
export const isDragging = ref(false);
