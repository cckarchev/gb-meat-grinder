/**
 * Grid track width for each playbook column (net-success column).
 * Keep in sync with `ColumnGrid` in PlaybookGrid.tsx.
 */
export const PLAYBOOK_COLUMN_TRACK = '3.65rem';

/**
 * Set on `AttackBlock` so wrap strip + column grid share one width (including narrow
 * viewports). Use in CSS: `var(--playbook-column-width, 3.65rem)`.
 */
export const PLAYBOOK_COLUMN_WIDTH_VAR = '--playbook-column-width';

/** Gap between playbook columns; keep in sync with `ColumnGrid` in PlaybookGrid.tsx. */
export const PLAYBOOK_GRID_GAP = '0.4rem';
