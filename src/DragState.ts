import { ref } from "vue";

/** True while a ticket card is being dragged, so link tooltips stay out of the way. */
export const isDragging = ref(false);
