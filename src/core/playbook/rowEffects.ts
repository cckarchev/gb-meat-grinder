/** Effects each pick carries into later swings: TAC, DEF and the ARM condition. */

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
import { KNOCKED_DOWN_EFFECT } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

const NO_EFFECTS: PickEffects = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReduction: 0,
  damageBonusForLater: 0,
};

/**
 * Effects this pick carries into later swings. A Knock Down after the first one
 * or on a target that starts Knocked Down, or a Once Per Turn play an earlier
 * pick already used, adds nothing.
 */
export const pickEffectsForLaterSwings = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  enemyKnockedDown: boolean,
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
      enemyKnockedDown,
    );

  if (redundantKnockDown) {
    return NO_EFFECTS;
  }

  if (!choiceUsesCharacterPlay(attacker, id)) {
    return {
      tacBonusForLater: result.tacBonusForLater ?? 0,
      defReductionForLater: result.defReductionForLater ?? 0,
      armorReduction: 0,
      damageBonusForLater: 0,
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

  return characterPlayPickEffects(attacker, play, damageMods.assistEngaged);
};

/**
 * The name a pick's carried effect goes by, for the "same name does not stack"
 * rule: the play's id when the pick triggers one, the shared Knock Down name for
 * a KD, otherwise the playbook result's id.
 */
export const pickEffectName = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
): string => {
  const id = wrapPicks[attackIndex][pickIndex];

  if (id == null) {
    return '';
  }

  if (choiceUsesCharacterPlay(attacker, id)) {
    const play = effectivePlayForPick(
      attacker,
      characterPlayPicks,
      attackIndex,
      pickIndex,
    );

    return play ?? id;
  }

  if (getPlaybookResult(attacker, id).appliesKnockDown) {
    return KNOCKED_DOWN_EFFECT;
  }

  return id;
};
