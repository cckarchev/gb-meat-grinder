import type { CustomPropertyStyle } from "./customProperties";

/**
 * Inline style handing the attacker's guild color to a CSS module as
 * `--guild-color`.
 */
export const guildColorStyle = (color: string): CustomPropertyStyle => ({
  "--guild-color": color,
});
