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
  /** What a target damaged by this model suffers for the later swings (Searing Strike). */
  onDamage?: { armorReduction?: number; burning?: boolean };
  /** +DMG to playbook damage results while the target is Burning (Burning Passion). */
  playbookDamageVsBurning?: number;
  /** Unmodified DMG added to the charge attack when it picks a playbook damage result (Sweeping Charge). */
  chargeDamage?: number;
};

/** Thresher's Don't Fear The... (activated, Once Per Turn). */
export const dontFearTheReaper: CharacterTrait = {
  id: 'dontFearTheReaper',
  label: "Don't Fear The...",
  tooltip:
    'Remove a Harvest marker to deal 3 unmodified damage (a character trait: ' +
    'Tough Hide and damage buffs do not apply).',
  active: true,
  flatDamage: 3,
};

export const searingStrike: CharacterTrait = {
  id: 'searingStrike',
  label: 'Searing Strike',
  tooltip:
    'Enemy models damaged by this model suffer -1 ARM for the rest of the ' +
    'turn and the burning condition. Only later attacks benefit.',
  onDamage: { armorReduction: 1, burning: true },
};

export const burningPassion: CharacterTrait = {
  id: 'burningPassion',
  label: 'Burning Passion',
  tooltip: '+1 DMG to playbook damage results while attacking a Burning enemy.',
  playbookDamageVsBurning: 1,
};

export const sweepingCharge: CharacterTrait = {
  id: 'sweepingCharge',
  label: 'Sweeping Charge',
  tooltip:
    'When the charge attack picks a playbook damage result, models in her ' +
    'melee zone suffer 3 DMG (a character trait: Tough Hide and damage buffs ' +
    'do not apply). It lands with the charge attack, so later attacks see ' +
    'Searing Strike.',
  chargeDamage: 3,
};
