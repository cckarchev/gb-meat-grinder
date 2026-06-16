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
};

export const stagger: CharacterPlay = {
  id: 'stagger',
  label: 'Stagger',
  defReductionForLater: 1,
};

export const theyAintTough: CharacterPlay = {
  id: 'theyAintTough',
  label: "They Ain't Tough!",
  armorReduction: 1,
};
