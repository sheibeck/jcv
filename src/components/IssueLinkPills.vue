<template>
  <span v-if="pills.length" class="link-pills">
    <button v-for="pill in pills" :key="pill.id" type="button"
      class="badge link-pill" :class="{ 'fst-italic': pill.italic }" :style="{ '--pill-color': pill.color }"
      :data-pill="pill.id"
      :aria-expanded="isActive(pill.id)" :aria-controls="isActive(pill.id) ? tooltipId : undefined"
      :aria-label="pill.ariaLabel"
      @mouseenter="scheduleOpen" @mouseleave="scheduleClose" @focus="openNow" @blur="scheduleClose" @click="openNow">
      {{ pill.label }}
    </button>

    <Teleport to="body">
      <div v-if="isOpen && tooltipEntries.length" :id="tooltipId" ref="tooltipEl" class="link-tooltip" role="region"
        :aria-label="`Tickets ${ticketKey} is waiting on`" :style="tooltipStyle"
        @mouseenter="cancelClose" @mouseleave="scheduleClose" @focusin="cancelClose" @focusout="scheduleClose">
        <div v-for="entry in tooltipEntries" :key="entry.id" class="link-row" :style="{ '--pill-color': entry.def.color }">
          <div class="d-flex align-items-center gap-2">
            <span class="badge link-kind fst-italic">{{ entry.def.label }}</span>
            <span class="fw-bold">{{ entry.link.Key }}</span>
            <span class="badge" :class="statusClass(entry.link)">{{ entry.link.StatusName }}</span>
            <!-- Same Font Awesome file icon (U+F15B) the sub-task cards use for their Jira link -->
            <a :href="getIssueUrl(entry.link.Key)" target="_blank" rel="noopener"
              :title="`Jira Issue ${entry.link.Key}`" :aria-label="`Open ${entry.link.Key} in Jira`"><i class="fas" aria-hidden="true">&#xf15b;</i></a>
          </div>
          <hr class="link-divider">
          <div class="link-summary">{{ entry.link.Summary }}</div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { getLinks, openLinks, type IssueLink, type LinkRelation } from "@/IssueLinks";
import { isDragging } from "@/DragState";
import { getIssueUrl } from "@/Utils";

const OPEN_DELAY_MS = 250;
const CLOSE_DELAY_MS = 150;
const GAP_PX = 6;
const EDGE_PX = 8;
// Most pills a card shows. Past this, the last slot becomes "+N more" so a ticket with many
// blockers can't stretch the card; the "+N more" tooltip lists the rest.
const MAX_PILLS = 3;
const OVERFLOW_ID = "overflow";
const OVERFLOW_COLOR = "var(--bs-gray-700)";

interface KindDef { kind: string; relation: LinkRelation; label: string; color: string }
// In display order: blockers before dependencies, so "+N more" hides dependencies first.
// `color` is the one place each kind's color is set (pill, tooltip label and tooltip box edge).
const KINDS: KindDef[] = [
  { kind: "blocked", relation: "is blocked by", label: "Blocked by", color: "var(--jcv-blocked)" },
  { kind: "dependsOn", relation: "depends on", label: "Depends on", color: "var(--jcv-depends-on)" },
];

const props = defineProps<{ ticketKey: string }>();

// One entry per open linked ticket
const entries = computed(() => KINDS.flatMap(def =>
  openLinks(getLinks(props.ticketKey), def.relation).map(link => ({ id: `${def.kind}:${link.Key}`, def, link }))));
const visibleEntries = computed(() =>
  entries.value.length <= MAX_PILLS ? entries.value : entries.value.slice(0, MAX_PILLS - 1));
const hiddenEntries = computed(() => entries.value.slice(visibleEntries.value.length));

// Everything rendered as a pill: the visible entries, plus "+N more" when some are hidden
const pills = computed(() => {
  const list = visibleEntries.value.map(e => ({
    id: e.id, label: `${e.def.label} ${e.link.Key}`, ariaLabel: `${e.def.label} ${e.link.Key}`, color: e.def.color, italic: true,
  }));
  const hidden = hiddenEntries.value;
  if (hidden.length) {
    list.push({
      id: OVERFLOW_ID,
      label: `+${hidden.length} more`,
      ariaLabel: `${hidden.length} more: ${hidden.map(e => `${e.def.label} ${e.link.Key}`).join(", ")}`,
      color: OVERFLOW_COLOR,
      italic: false,
    });
  }
  return list;
});

// Which pill the tooltip belongs to: an entry id, or OVERFLOW_ID for "+N more"
const activePill = ref("");
// Uses visibleEntries (not entries): if a refresh moves the hovered pill into "+N more", this becomes
// empty and the tooltip closes instead of staying attached to a pill that's gone.
const tooltipEntries = computed(() => activePill.value === OVERFLOW_ID
  ? hiddenEntries.value
  : visibleEntries.value.filter(e => e.id === activePill.value));

const tooltipId = `link-tooltip-${Math.random().toString(36).slice(2, 10)}`;
const isOpen = ref(false);
const tooltipEl = ref<HTMLElement>();
const tooltipStyle = ref<Record<string, string>>({ visibility: "hidden" });
let anchor: HTMLElement | null = null;
let openTimer: number | undefined;
let closeTimer: number | undefined;

const isActive = (pillId: string) => isOpen.value && activePill.value === pillId;

const statusClass = (link: IssueLink) => ({
  "bg-secondary": link.StatusCategory === "new",
  "bg-primary": link.StatusCategory === "indeterminate",
  "bg-success": link.StatusCategory === "done",
});

const clearTimers = () => {
  window.clearTimeout(openTimer);
  window.clearTimeout(closeTimer);
};

// Opens hidden; the watcher below places it once it has rendered.
const open = (target: HTMLElement) => {
  // Skip if dragging, if the pill was removed during the open delay, or if it's already open on this pill
  if (isDragging.value || !target.isConnected || (isOpen.value && anchor === target)) return;
  anchor = target;
  activePill.value = target.dataset.pill ?? "";
  tooltipStyle.value = { visibility: "hidden" };
  isOpen.value = true;
};

const close = () => {
  clearTimers();
  isOpen.value = false;
  anchor = null;
};

const scheduleOpen = (event: MouseEvent) => {
  if (isDragging.value) return;
  const target = event.currentTarget as HTMLElement;
  clearTimers();
  openTimer = window.setTimeout(() => open(target), OPEN_DELAY_MS);
};

const openNow = (event: Event) => {
  clearTimers();
  open(event.currentTarget as HTMLElement);
};

const scheduleClose = () => {
  clearTimers();
  closeTimer = window.setTimeout(close, CLOSE_DELAY_MS);
};

const cancelClose = () => window.clearTimeout(closeTimer);

// Below the pill, flipped above when it would run off the bottom; clamped horizontally.
const position = () => {
  if (!anchor || !tooltipEl.value) return;
  const pill = anchor.getBoundingClientRect();
  const tip = tooltipEl.value.getBoundingClientRect();

  let top = pill.bottom + GAP_PX;
  if (top + tip.height > window.innerHeight - EDGE_PX && pill.top - GAP_PX - tip.height >= EDGE_PX) {
    top = pill.top - GAP_PX - tip.height;
  }
  const left = Math.max(EDGE_PX, Math.min(pill.left, window.innerWidth - tip.width - EDGE_PX));

  tooltipStyle.value = { top: `${top}px`, left: `${left}px` };
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") close();
};
// The tooltip is fixed-position, so close it rather than let it drift when the page moves.
const onViewportChange = (event: Event) => {
  if (tooltipEl.value && event.target instanceof Node && tooltipEl.value.contains(event.target)) return;
  close();
};

const attachListeners = () => {
  document.addEventListener("keydown", onKeydown);
  window.addEventListener("scroll", onViewportChange, true);
  window.addEventListener("resize", onViewportChange);
};

const detachListeners = () => {
  document.removeEventListener("keydown", onKeydown);
  window.removeEventListener("scroll", onViewportChange, true);
  window.removeEventListener("resize", onViewportChange);
};

watch(isOpen, (value) => (value ? attachListeners() : detachListeners()));

watch(isDragging, (dragging) => {
  if (dragging) close();
});

// The one place the tooltip is positioned: when it opens, switches pills, or its content changes.
// Closes it instead if there's nothing to show (blocker resolved) or its pill is gone.
watch([isOpen, tooltipEntries], async ([opened, shown]) => {
  if (!opened) return;
  if (shown.length === 0 || !anchor?.isConnected) {
    close();
    return;
  }
  await nextTick();
  position();
});

onBeforeUnmount(() => {
  close();
  // Remove listeners directly: the isOpen watcher queued by close() never runs once the component unmounts.
  detachListeners();
});
</script>

<style scoped>
/* Inline on the ticket-number line, after the other badges; wraps as a group if the line runs out of room.
   MAX_PILLS keeps a ticket with many blockers from taking over the line. */
.link-pills {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-left: 0.25rem;
  vertical-align: middle;
}

/* --pill-color is set per pill / tooltip row from KINDS (colors live in src/assets/main.css).
   White text holds on both: blocked 5.3:1, depends on 4.5:1. */
.link-pill,
.link-kind {
  background-color: var(--pill-color);
  color: var(--bs-white);
}

.link-pill {
  border: none;
  cursor: help;
  font-size: 0.75em;
}

.link-pill:focus-visible {
  outline: 2px solid var(--bs-white);
  outline-offset: 1px;
}

.link-tooltip {
  position: fixed;
  z-index: 1040;
  width: 360px;
  max-width: calc(100vw - 16px);
  max-height: 50vh;
  overflow-y: auto;
  padding: 0.5rem 0.6rem;
  background: var(--bs-dark);
  color: var(--bs-gray-300);
  border: 1px solid var(--bs-gray-600);
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
  font-size: 0.85rem;
}

/* Each ticket in its own box, with a left edge in its pill color */
.link-row {
  padding: 0.45rem 0.6rem;
  background: var(--jcv-tooltip-row-bg);
  border: 1px solid var(--bs-gray-700);
  border-left: 4px solid var(--pill-color);
  border-radius: 0.375rem;
}

.link-row + .link-row {
  margin-top: 0.5rem;
}

.link-summary {
  overflow-wrap: anywhere;
}

.link-divider {
  margin: 0.3rem 0;
  border-color: var(--bs-gray-600);
  opacity: 0.5;
}
</style>
