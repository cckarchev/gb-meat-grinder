import type { CharacterPlay } from '@/types/core/playbook';

/**
 * Shared catalog of character plays. These are not guild- or model-specific:
 * many models across guilds share the same play (e.g. Singled Out, Stagger).
 * Each model lists the ones its GB / 1GB results can trigger.
 */

export const singledOut: CharacterPlay = {
  id: 'singledOut',
  label: 'Singled Out',
  tacBonusForLater: 2,
  oncePerTurn: true,
};

export const stagger: CharacterPlay = {
  id: 'stagger',
  label: 'Stagger',
  defReductionForLater: 1,
  oncePerTurn: true,
};

export const theyAintTough: CharacterPlay = {
  id: 'theyAintTough',
  label: "They Ain't Tough!",
  armorReduction: 1,
  oncePerTurn: true,
};

/**
 * Windle's Snack Break (recover HP). It has no effect on the attack math — it
 * neither buffs later swings nor adds damage — but it is still a character play
 * the GB result can trigger, so it is shown as a (no-op) menu option.
 */
export const snackBreak: CharacterPlay = {
  id: 'snackBreak',
  label: 'Snack Break',
  oncePerTurn: true,
};

/**
 * Cast's Shield Glare. Targets an enemy for −1 TAC and −1 DEF; only the −1 DEF
 * matters when Cast is the one attacking, so it carries as a DEF reduction.
 * Marked once-per-turn: it is a single debuff source, and a −DEF debuff does not
 * stack with itself, so re-triggering it on a later GB line adds nothing.
 */
export const shieldGlare: CharacterPlay = {
  id: 'shieldGlare',
  label: 'Shield Glare',
  defReductionForLater: 1,
  oncePerTurn: true,
};

/**
 * Veteran Cinder's Impale. Triggered off her GB result (its `2/GB` cost), it
 * deals 3 flat damage. It is modified like a playbook line — Tough Hide reduces
 * it, a +DMG buff (Tooled Up) lifts it — but Burning Passion (playbook-only)
 * does not apply.
 */
export const impale: CharacterPlay = {
  id: 'impale',
  label: 'Impale',
  flatDamage: 3,
  oncePerTurn: true,
};
