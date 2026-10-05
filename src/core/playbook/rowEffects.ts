/** Effects each pick carries into later swings: TAC, DEF and the ARM condition. */

import { picksOnEarlierSwings } from '@/core/attacks/attackRows';
import { characterPlayPickEffects } from '@/core/characterPlays/characterPlayEffects';
import { effectivePlayForPick } from '@/core/characterPlays/characterPlayLookup';
import { characterPlayUsageBeforePick } from '@/core/characterPlays/characterPlayUsage';
import { knockDownTakenBeforePick } from '@/core/playbook/knockDown';
import type {
  CharacterPlayPickSlot,
  PickEffects,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  choiceUsesCharacterPlay,
  getPlaybookResult,
} from '@/core/playbook/playbookIndex';
import { MAX_ARMOR_REDUCTION } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

const NO_EFFECTS: PickEffects = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReduction: 0,
};

/**
 * Effects this pick carries into later swings. A Knock Down after the first one, or
 * a Once Per Turn play an earlier pick already used, adds nothing.
 */
export const pickEffectsForLaterSwings = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): PickEffects => {
  const id = wrapPicks[attackIndex][pickIndex];

  if (id == null) {
    return NO_EFFECTS;
  }

  const result = getPlaybookResult(attacker, id);

  const redundantKnockDown =
    result.appliesKnockDown &&
    knockDownTakenBeforePick(
      attacker,
      wrapPicks,
      attackIndex,
      pickIndex,
      damageMods,
      activeBaseCount,
    );

  if (redundantKnockDown) {
    return NO_EFFECTS;
  }

  if (!choiceUsesCharacterPlay(attacker, id)) {
    return {
      tacBonusForLater: result.tacBonusForLater ?? 0,
      defReductionForLater: result.defReductionForLater ?? 0,
      armorReduction: 0,
    };
  }

  const used = characterPlayUsageBeforePick(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    pickIndex,
    damageMods,
    activeBaseCount,
  );

  const play = effectivePlayForPick(
    attacker,
    characterPlayPicks,
    attackIndex,
    pickIndex,
  );

  if (play == null || used.has(play)) {
    return NO_EFFECTS;
  }

  return characterPlayPickEffects(attacker, play);
};

/**
 * ARM this swing loses because an earlier swing's GB triggered a character play
 * that reduces ARM (e.g. They Ain't Tough!), in activation order (strictly
 * earlier). A condition, so it never stacks past `MAX_ARMOR_REDUCTION`.
 */
export const armorReductionBeforeAttack = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  activeBaseCount: number,
): number => {
  const earlierPicks = picksOnEarlierSwings(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
    attackIndex,
  );

  let reduction = 0;

  for (const earlier of earlierPicks) {
    const effects = pickEffectsForLaterSwings(
      attacker,
      wrapPicks,
      characterPlayPicks,
      earlier.attackIndex,
      earlier.pickIndex,
      damageMods,
      activeBaseCount,
    );

    reduction += effects.armorReduction;
  }

  return Math.min(MAX_ARMOR_REDUCTION, reduction);
};
