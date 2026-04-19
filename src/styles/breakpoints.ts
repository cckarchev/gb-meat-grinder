/**
 * Phones and small tablets. Uses `px` so the breakpoint is stable even if
 * `:root` font-size changes (rem-based MQs can misfire vs the visual viewport).
 */
export const narrowViewport = '@media (max-width: 720px)';

/** Small phones: tighter playbook columns and controls. */
export const extraNarrowViewport = '@media (max-width: 400px)';
