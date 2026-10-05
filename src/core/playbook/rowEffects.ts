/** Effects each pick carries into later swings: TAC, DEF and the ARM condition. */

import { activationAttackIndices } from '@/core/attacks/attackRows';
import { characterPlayPickModifiers } from '@/core/characterPlays/characterPlayEffects';
import { defaultCharacterPlayId } from '@/core/characterPlays/characterPlayLookup';
import { characterPlayUsageBeforePick } from '@/core/characterPlays/characterPlayUsage';
import { kdAlreadyTakenBeforePick } from '@/core/playbook/knockDown';
import type {
  CharacterPlayPickSlot,
  PickEffects,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  choiceUsesCharacterPlay,
  getPlaybookResult,
} from '@/core/playbook/wrapSlots';
import { MAX_ARMOR_REDUCTION } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

const NO_EFFECTS: PickEffects = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReduction: 0,
};

/**
 * Modifiers this pick adds to later swings. A Knock Down after the first one, or
 * a Once Per Turn play an earlier pick already used, adds nothing.
 */
export const rowEffectsForPick = (
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
    kdAlreadyTakenBeforePick(
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
      tacBonusForLater: result.tacBonusForLater,
      defReductionForLater: result.defReductionForLater,
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

  const play =
    characterPlayPicks[attackIndex]?.[pickIndex] ??
    defaultCharacterPlayId(attacker);

  if (play == null || used.has(play)) {
    return NO_EFFECTS;
  }

  return characterPlayPickModifiers(attacker, play);
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
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  const orderPosition = order.indexOf(attackIndex);

  if (orderPosition < 0) {
    return 0;
  }

  let reduction = 0;

  for (let position = 0; position < orderPosition; position++) {
    const earlierIndex = order[position];
    const earlierPicks = wrapPicks[earlierIndex];

    for (let pickIndex = 0; pickIndex < earlierPicks.length; pickIndex++) {
      if (earlierPicks[pickIndex] == null) {
        continue;
      }

      const effects = rowEffectsForPick(
        attacker,
        wrapPicks,
        characterPlayPicks,
        earlierIndex,
        pickIndex,
        damageMods,
        activeBaseCount,
      );

      reduction += effects.armorReduction;
    }
  }

  return Math.min(MAX_ARMOR_REDUCTION, reduction);
};
