<template>
  <span v-if="entries.length" class="link-pills">
    <button v-for="entry in visibleEntries" :key="entry.id" type="button"
      class="badge link-pill fst-italic" :class="KINDS[entry.kind].colorClass" :data-pill="entry.id"
      :aria-expanded="isOpen && activePill === entry.id"
      :aria-controls="isOpen && activePill === entry.id ? tooltipId : undefined"
      :aria-label="`${KINDS[entry.kind].label} ${entry.link.Key}`"
      @mouseenter="scheduleOpen" @mouseleave="scheduleClose" @focus="openNow" @blur="scheduleClose" @click="openNow">
      {{ KINDS[entry.kind].label }} {{ entry.link.Key }}
    </button>
    <button v-if="hiddenEntries.length" type="button" class="badge link-pill pill-overflow" data-pill="overflow"
      :aria-expanded="isOpen && activePill === 'overflow'"
      :aria-controls="isOpen && activePill === 'overflow' ? tooltipId : undefined"
      :aria-label="`${hiddenEntries.length} more: ${hiddenEntries.map(e => `${KINDS[e.kind].label} ${e.link.Key}`).join(', ')}`"
      @mouseenter="scheduleOpen" @mouseleave="scheduleClose" @focus="openNow" @blur="scheduleClose" @click="openNow">
      +{{ hiddenEntries.length }} more
    </button>

    <Teleport to="body">
      <div v-if="isOpen && tooltipEntries.length" :id="tooltipId" ref="tooltipEl" class="link-tooltip" role="region"
        :aria-label="`Tickets ${ticketKey} is waiting on`" :style="tooltipStyle"
        @mouseenter="cancelClose" @mouseleave="scheduleClose" @focusin="cancelClose" @focusout="scheduleClose">
        <div v-for="entry in tooltipEntries" :key="entry.id" class="link-row" :class="`kind-${entry.kind}`">
          <div class="d-flex align-items-center gap-2">
            <span class="badge fst-italic" :class="KINDS[entry.kind].colorClass">
              {{ KINDS[entry.kind].label }}
            </span>
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
import { getLinks, isDragging, openLinks, type IssueLink, type LinkRelation } from "@/IssueLinks";
import { getIssueUrl } from "@/Utils";

const OPEN_DELAY_MS = 250;
const CLOSE_DELAY_MS = 150;
const GAP_PX = 6;
const EDGE_PX = 8;
// Most pills a card shows. Past this, the last slot becomes "+N more" so a ticket with many
// blockers can't stretch the card; the "+N more" tooltip lists the rest.
const MAX_PILLS = 3;

type PillKind = "blocked" | "dependsOn";
// Order matters: blockers are shown before dependencies, so "+N more" hides dependencies first.
const KINDS: Record<PillKind, { relation: LinkRelation; label: string; colorClass: string }> = {
  blocked: { relation: "is blocked by", label: "Blocked by", colorClass: "pill-blocked" },
  dependsOn: { relation: "depends on", label: "Depends on", colorClass: "pill-depends-on" },
};

const props = defineProps<{ ticketKey: string }>();

const links = computed(() => getLinks(props.ticketKey) ?? []);
// One pill per open linked ticket
const entries = computed(() => (Object.keys(KINDS) as PillKind[]).flatMap(kind =>
  openLinks(links.value, KINDS[kind].relation).map(link => ({ id: `${kind}:${link.Key}`, kind, link }))));
const visibleEntries = computed(() =>
  entries.value.length <= MAX_PILLS ? entries.value : entries.value.slice(0, MAX_PILLS - 1));
const hiddenEntries = computed(() => entries.value.slice(visibleEntries.value.length));

// Which pill the tooltip belongs to: an entry id, or "overflow" for "+N more"
const activePill = ref("");
// Uses visibleEntries (not entries): if a refresh moves the hovered pill into "+N more", this becomes
// empty and the tooltip closes instead of staying attached to a pill that's gone.
const tooltipEntries = computed(() => activePill.value === "overflow"
  ? hiddenEntries.value
  : visibleEntries.value.filter(e => e.id === activePill.value));

const tooltipId = `link-tooltip-${Math.random().toString(36).slice(2, 10)}`;
const isOpen = ref(false);
const tooltipEl = ref<HTMLElement>();
const tooltipStyle = ref<Record<string, string>>({ visibility: "hidden" });
let anchor: HTMLElement | null = null;
let openTimer: number | undefined;
let closeTimer: number | undefined;

const statusClass = (link: IssueLink) => ({
  "bg-secondary": link.StatusCategory === "new",
  "bg-primary": link.StatusCategory === "indeterminate",
  "bg-success": link.StatusCategory === "done",
});

const clearTimers = () => {
  window.clearTimeout(openTimer);
  window.clearTimeout(closeTimer);
};

const open = async (target: HTMLElement) => {
  // Skip if dragging, or if the pill was removed while the open delay ran (it would measure as 0,0)
  if (isDragging.value || !target.isConnected) return;
  anchor = target;
  activePill.value = target.dataset.pill ?? "";
  tooltipStyle.value = { visibility: "hidden" }; // measure first, then place
  isOpen.value = true;
  await nextTick();
  position();
};

const close = () => {
  clearTimers();
  isOpen.value = false;
  anchor = null;
};

const scheduleOpen = (event: MouseEvent) => {
  if (isDragging.value) return;
  const target = event.currentTarget as HTMLElement;
  window.clearTimeout(closeTimer);
  window.clearTimeout(openTimer);
  if (isOpen.value && anchor === target) return;
  openTimer = window.setTimeout(() => open(target), OPEN_DELAY_MS);
};

const openNow = (event: Event) => {
  clearTimers();
  open(event.currentTarget as HTMLElement);
};

const scheduleClose = () => {
  window.clearTimeout(openTimer);
  window.clearTimeout(closeTimer);
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
  const left = Math.min(Math.max(pill.left, EDGE_PX), window.innerWidth - tip.width - EDGE_PX);

  tooltipStyle.value = { top: `${top}px`, left: `${Math.max(left, EDGE_PX)}px` };
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

// A refresh can leave the open tooltip with nothing to show (e.g. the blocker was resolved); close it properly.
watch(tooltipEntries, async (shown) => {
  if (!isOpen.value) return;
  if (shown.length === 0 || !anchor?.isConnected) {
    close();
    return;
  }
  // Content changed while open (e.g. "+N more" grew): re-place it so it doesn't run off the screen.
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

.link-pill {
  border: none;
  cursor: help;
  font-size: 0.75em;
}

/* Colors live in src/assets/main.css; both hold white text (blocked 5.3:1, depends on 4.5:1). */
.pill-blocked {
  background-color: var(--jcv-blocked);
  color: #fff;
}

.pill-depends-on {
  background-color: var(--jcv-depends-on);
  color: #fff;
}

.pill-overflow {
  background-color: #495057;
  color: #fff;
}

.link-pill:focus-visible {
  outline: 2px solid #fff;
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
  background: #212529;
  color: #dee2e6;
  border: 1px solid #6c757d;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
  font-size: 0.85rem;
}

/* Each ticket in its own box, with a left edge in its pill color */
.link-row {
  padding: 0.45rem 0.6rem;
  background: #2b3035;
  border: 1px solid #495057;
  border-left-width: 4px;
  border-radius: 0.375rem;
}

.link-row + .link-row {
  margin-top: 0.5rem;
}

.link-row.kind-blocked {
  border-left-color: var(--jcv-blocked);
}

.link-row.kind-dependsOn {
  border-left-color: var(--jcv-depends-on);
}

.link-summary {
  overflow-wrap: anywhere;
}

.link-divider {
  margin: 0.3rem 0;
  border-color: #6c757d;
  opacity: 0.5;
}
</style>
