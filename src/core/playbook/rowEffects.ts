/** Effects each pick carries into later swings: TAC, DEF and the ARM condition. */

import type { ActivationOrderParams } from '@/core/attacks/attackSequence.types';
import { characterPlayPickEffects } from '@/core/characterPlays/characterPlayEffects';
import { effectivePlayForPick } from '@/core/characterPlays/characterPlayLookup';
import { characterPlayUsageBeforePick } from '@/core/characterPlays/characterPlayUsage';
import type { AttackPlan, PickPosition } from '@/core/plan/attackPlan.types';
import { knockDownTakenBeforePick } from '@/core/playbook/knockDown';
import type { PickEffects } from '@/core/playbook/playbook.types';
import {
  choiceUsesCharacterPlay,
  getPlaybookResult,
} from '@/core/playbook/playbookIndex';
import { KNOCKED_DOWN_EFFECT } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

const NO_EFFECTS: PickEffects = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReductionForLater: 0,
  damageBonusForLater: 0,
};

/**
 * Effects this pick carries into later swings. A Knock Down after the first one
 * or on a target that starts Knocked Down, or a Once Per Turn play an earlier
 * pick already used, adds nothing.
 */
export const pickEffectsForLaterSwings = (
  order: ActivationOrderParams,
  plan: AttackPlan,
  position: PickPosition,
  enemyKnockedDown: boolean,
): PickEffects => {
  const { attacker, damageMods } = order;
  const { attackIndex, pickIndex } = position;
  const id = plan.wrapPicks[attackIndex][pickIndex];

  if (id == null) {
    return NO_EFFECTS;
  }

  const result = getPlaybookResult(attacker, id);

  const redundantKnockDown =
    result.appliesKnockDown &&
    knockDownTakenBeforePick(order, plan.wrapPicks, position, enemyKnockedDown);

  if (redundantKnockDown) {
    return NO_EFFECTS;
  }

  if (!choiceUsesCharacterPlay(attacker, id)) {
    return {
      tacBonusForLater: result.tacBonusForLater ?? 0,
      defReductionForLater: result.defReductionForLater ?? 0,
      armorReductionForLater: 0,
      damageBonusForLater: 0,
    };
  }

  const used = characterPlayUsageBeforePick(order, plan, position);

  const play = effectivePlayForPick(
    attacker,
    plan.characterPlayPicks,
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
  plan: AttackPlan,
  position: PickPosition,
): string => {
  const { attackIndex, pickIndex } = position;
  const id = plan.wrapPicks[attackIndex][pickIndex];

  if (id == null) {
    return '';
  }

  if (choiceUsesCharacterPlay(attacker, id)) {
    const play = effectivePlayForPick(
      attacker,
      plan.characterPlayPicks,
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
