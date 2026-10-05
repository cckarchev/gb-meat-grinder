/** Default grid track width for each playbook (net-success) column. */
export const PLAYBOOK_COLUMN_TRACK = '3.65rem';

/**
 * Custom property `AttackBlock` sets to narrow the column track on small
 * viewports; `ColumnGrid` reads it, falling back to `PLAYBOOK_COLUMN_TRACK`.
 */
export const PLAYBOOK_COLUMN_WIDTH_VAR = '--playbook-column-width';

/** Gap between playbook columns. */
export const PLAYBOOK_GRID_GAP = '0.4rem';
