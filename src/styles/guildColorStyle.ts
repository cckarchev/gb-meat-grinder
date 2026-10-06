import type { CustomPropertyStyle } from '@/styles/customProperties';

/** Inline style handing the attacker's guild color to a CSS module as `--guild-color`. */
export const guildColorStyle = (color: string): CustomPropertyStyle => {
  return { '--guild-color': color };
};
