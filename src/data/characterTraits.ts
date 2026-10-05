/**
 * Shared catalog of character traits. Like character plays, many models across
 * guilds share the same trait (e.g. Searing Strike, Sweeping Charge), so each is
 * defined once here and models list the ones their card has. A trait's id is
 * also its effect's name for the "same name does not stack" rule.
 */

export type CharacterTrait = {
  id: string;
  label: string;
  tooltip: string;
  /** Activated by the user (a checkbox). Passive traits are always on. */
  active?: boolean;
  /** Unmodified DMG dealt when an active trait is activated. */
  flatDamage?: number;
};

/** Thresher's Don't Fear The... (activated, Once Per Turn). */
export const dontFearTheReaper: CharacterTrait = {
  id: 'dontFearTheReaper',
  label: "Don't Fear The Reaper",
  tooltip:
    'Remove a Harvest marker to deal 3 unmodified damage (a character trait: ' +
    'Tough Hide and damage buffs do not apply).',
  active: true,
  flatDamage: 3,
};
