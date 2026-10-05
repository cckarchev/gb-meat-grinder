/** Per-swing TAC after charge, cover, Bonus Time and everything earlier swings carried over. */

import { isChargeSwing } from '@/core/attacks/attackStructure';
import {
  coverTacPenaltyForAttack,
  modifiersBeforeAttack,
} from '@/core/attacks/earlierSwingEffects';
import {
  effectiveDefMinRoll,
  enemyDefBaseForAttackRow,
  tacBonusFromDefReductionCap,
} from '@/core/attacks/swingDefense';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  BONUS_TIME_TAC_BONUS,
  CHARGE_TAC_BONUS,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const tacForAttack = (
  attacker: AttackerData,
  attackIndex: number,
  chargeAttackIndex: number,
  carriedTacBonus: number,
  activeBaseCount: number,
  coverTacPenalty: number,
  bonusTimeTacBonus: number,
  initialTacModifier: number,
): number => {
  const charge = isChargeSwing(attackIndex, chargeAttackIndex, activeBaseCount)
    ? CHARGE_TAC_BONUS
    : 0;

  return (
    attacker.tac +
    charge +
    carriedTacBonus -
    coverTacPenalty +
    bonusTimeTacBonus +
    initialTacModifier
  );
};

/** What one swing rolls: its dice and the DEF each die must meet. */
export type SwingTacAndDef = {
  tac: number;
  defMinRoll: number;
};

/** TAC and to-hit DEF for one row: carry-over, DEF-floor dice, cover and Bonus Time combined. */
export const swingTacAndDef = (
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
): SwingTacAndDef => {
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
  const defMinRoll = effectiveDefMinRoll(defForRow, defReduction);

  const coverPenalty = coverTacPenaltyForAttack(
    attacker,
    enemyHasCover,
    wrapPicks,
    attackIndex,
    activeBaseCount,
  );

  const bonusTimeTac =
    bonusTimeByAttack[attackIndex] === true ? BONUS_TIME_TAC_BONUS : 0;

  const tac = tacForAttack(
    attacker,
    attackIndex,
    chargeAttackIndex,
    tacBonus + tacFromDefCap,
    activeBaseCount,
    coverPenalty,
    bonusTimeTac,
    initialTacModifier,
  );

  return { tac, defMinRoll };
};

/** Full TAC for one row; see `swingTacAndDef`. */
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
  const { tac } = swingTacAndDef(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    chargeAttackIndex,
    enemyHasCover,
    enemyDefensiveStance,
    damageMods,
    baseDef,
    bonusTimeByAttack,
    initialTacModifier,
    activeBaseCount,
  );

  return tac;
};
