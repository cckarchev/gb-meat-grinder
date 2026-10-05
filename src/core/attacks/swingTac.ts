/** Per-swing TAC after charge, cover, Bonus Time and everything earlier swings carried over. */

import {
  coverTacPenaltyForAttack,
  modifiersBeforeAttack,
} from '@/core/attacks/earlierSwingEffects';
import {
  enemyDefBaseForAttackRow,
  tacBonusFromDefReductionCap,
} from '@/core/attacks/swingDefense';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { BONUS_TIME_TAC_BONUS } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const CHARGE_TAC_BONUS = 4;

export const tacForAttack = (
  attacker: AttackerData,
  attackIndex: number,
  chargeAttackIndex: number,
  tacBonusFromSingledOut: number,
  activeBaseCount: number,
  coverTacPenalty = 0,
  bonusTimeTacBonus = 0,
  initialTacModifier = 0,
): number => {
  const charge =
    attackIndex < activeBaseCount && attackIndex === chargeAttackIndex
      ? CHARGE_TAC_BONUS
      : 0;

  return (
    attacker.tac +
    charge +
    tacBonusFromSingledOut -
    coverTacPenalty +
    bonusTimeTacBonus +
    initialTacModifier
  );
};

/** Full TAC for one row: carry-over, DEF-floor dice, cover and Bonus Time combined. */
export const tacForAttackRow = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  chargeAttackIndex: number,
  enemyHasCover: boolean,
  enemyDefensiveStance: boolean,
  damageMods: PlaybookDamageMods,
  baseDef: number,
  bonusTimeByAttack: readonly boolean[],
  initialTacModifier: number,
  activeBaseCount: number,
): number => {
  const { tacBonus, defReduction } = modifiersBeforeAttack(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    damageMods,
    activeBaseCount,
  );

  const defForRow = enemyDefBaseForAttackRow(
    baseDef,
    attackIndex,
    chargeAttackIndex,
    enemyDefensiveStance,
    activeBaseCount,
  );

  const tacFromDefCap = tacBonusFromDefReductionCap(defForRow, defReduction);

  const coverPen = coverTacPenaltyForAttack(
    attacker,
    enemyHasCover,
    wrapPicks,
    attackIndex,
    activeBaseCount,
  );

  const bonusTimeTac =
    bonusTimeByAttack[attackIndex] === true ? BONUS_TIME_TAC_BONUS : 0;

  return tacForAttack(
    attacker,
    attackIndex,
    chargeAttackIndex,
    tacBonus + tacFromDefCap,
    activeBaseCount,
    coverPen,
    bonusTimeTac,
    initialTacModifier,
  );
};
