import type { CharacterPlay } from '@/core/playbook/playbook.types';

/**
 * Shared catalog of character plays. These are not guild- or model-specific:
 * many models across guilds share the same play (e.g. Singled Out, Stagger).
 * Each model lists the ones its GB / 1GB results can trigger.
 */

export const singledOut: CharacterPlay = {
  id: 'singledOut',
  label: 'Singled Out',
  tacBonusForLater: 2,
  oncePerTurn: false,
};

export const stagger: CharacterPlay = {
  id: 'stagger',
  label: 'Stagger',
  defReductionForLater: 1,
  oncePerTurn: false,
};

export const theyAintTough: CharacterPlay = {
  id: 'theyAintTough',
  label: "They Ain't Tough!",
  armorReduction: 1,
  oncePerTurn: false,
};

/**
 * Windle's Snack Break (recover HP). It has no effect on the attack math (it
 * neither buffs later swings nor adds damage), but it is still a character play
 * the GB result can trigger, so it is shown as a (no-op) menu option.
 */
export const snackBreak: CharacterPlay = {
  id: 'snackBreak',
  label: 'Snack Break',
  oncePerTurn: true,
};

/** Cast's Shield Glare: -1 TAC and -1 DEF; only the -1 DEF matters to her attack. */
export const shieldGlare: CharacterPlay = {
  id: 'shieldGlare',
  label: 'Shield Glare',
  defReductionForLater: 1,
  oncePerTurn: false,
};

/** Cast's Shield Throw: scatters the ball, no effect on the attack math. */
export const shieldThrow: CharacterPlay = {
  id: 'shieldThrow',
  label: 'Shield Throw',
  oncePerTurn: false,
};

/** Veteran Cinder's Impale: 3 DMG, modified like playbook damage. */
export const impale: CharacterPlay = {
  id: 'impale',
  label: 'Impale',
  damage: 3,
  oncePerTurn: true,
};
