/** Roll context and hit odds for every swing in the activation. */

import { activationAttackIndices } from '@/core/attackRows';
import { BONUS_TIME_TAC_BONUS } from '@/core/constants';
import { hitProbabilityPerDie, probAttackSucceeds } from '@/core/probability';
import {
  armorForAttackRow,
  coverTacPenaltyForAttack,
  effectiveDefMinRoll,
  enemyDefBaseForAttackRow,
  modifiersBeforeAttack,
  tacBonusFromDefReductionCap,
  tacForAttack,
} from '@/core/swingModifiers';
import { wrapNetThresholdAllHits } from '@/core/wrapSlots';
import type { AttackerData } from '@/types/core/attacker';
import type { AttackRollContext } from '@/types/core/attackSequence';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';

export const computeAttackSequence = (
  attacker: AttackerData,
  baseDef: number,
  armor: number,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  chargeAttackIndex: number,
  enemyHasCover: boolean,
  enemyDefensiveStance: boolean,
  damageMods: PlaybookDamageMods,
  bonusTimeByAttack: readonly boolean[],
  initialTacModifier: number,
  activeBaseCount: number,
): { attacks: AttackRollContext[] } => {
  const attacks: AttackRollContext[] = [];

  for (const i of activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  )) {
    const { tacBonus, defReduction } = modifiersBeforeAttack(
      attacker,
      wrapPicks,
      characterPlayPicks,
      i,
      damageMods,
      activeBaseCount,
    );

    const defForRow = enemyDefBaseForAttackRow(
      baseDef,
      i,
      chargeAttackIndex,
      enemyDefensiveStance,
      activeBaseCount,
    );

    const tacFromDefCap = tacBonusFromDefReductionCap(defForRow, defReduction);
    const defMin = effectiveDefMinRoll(defForRow, defReduction);

    const coverPen = coverTacPenaltyForAttack(
      attacker,
      enemyHasCover,
      wrapPicks,
      i,
      activeBaseCount,
    );

    const bonusTimeTac =
      bonusTimeByAttack[i] === true ? BONUS_TIME_TAC_BONUS : 0;

    const tac = tacForAttack(
      attacker,
      i,
      chargeAttackIndex,
      tacBonus + tacFromDefCap,
      activeBaseCount,
      coverPen,
      bonusTimeTac,
      initialTacModifier,
    );

    const rowArmor = armorForAttackRow(
      attacker,
      armor,
      wrapPicks,
      characterPlayPicks,
      damageMods,
      i,
      activeBaseCount,
    );

    const pHit = hitProbabilityPerDie(defMin);
    const need = wrapNetThresholdAllHits(attacker, wrapPicks[i]);
    const prob = probAttackSucceeds(tac, pHit, rowArmor, need);

    attacks.push({
      attackIndex: i,
      tac,
      armor: rowArmor,
      defMinRoll: defMin,
      pHit,
      netSuccessesNeeded: need,
      prob,
    });
  }

  return { attacks };
};
