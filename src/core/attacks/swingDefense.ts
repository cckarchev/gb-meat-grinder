/** Enemy DEF and ARM for a swing after stance, conditions and earlier plays. */

import { isChargeSwing } from '@/core/attacks/attackStructure';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { armorReductionBeforeAttack } from '@/core/playbook/rowEffects';
import { clamp } from '@/core/shared/clamp';
import {
  ARM_MIN,
  DEF_MAX,
  DEF_MIN,
  DEFENSIVE_STANCE_DEF_BONUS,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Effective enemy DEF stat for this row: the charge into Defensive Stance gains
 * `DEFENSIVE_STANCE_DEF_BONUS`, capped at `DEF_MAX`.
 */
export const enemyDefForSwing = (
  enemyDef: number,
  attackIndex: number,
  chargeAttackIndex: number,
  enemyDefensiveStance: boolean,
  activeBaseCount: number,
): number => {
  const chargedIntoStance =
    enemyDefensiveStance &&
    isChargeSwing(attackIndex, chargeAttackIndex, activeBaseCount);

  const stanceBonus = chargedIntoStance ? DEFENSIVE_STANCE_DEF_BONUS : 0;

  return Math.min(DEF_MAX, enemyDef + stanceBonus);
};

export const effectiveDefMinRoll = (
  baseDef: number,
  defReduction: number,
): number => {
  const reducedDef = baseDef - defReduction;

  return clamp(reducedDef, DEF_MIN, DEF_MAX);
};

/**
 * Enemy DEF cannot be reduced below `DEF_MIN` on the dice (1s always miss). Each
 * point of DEF reduction past that floor, whether from playbook plays
 * (`defReduction`) or from pre-attack conditions already baked into `baseDef`
 * (Knocked Down, Snared), instead becomes +1 attack die. `baseDef` may be below
 * `DEF_MIN` here; the surplus below the floor is the bonus.
 */
export const tacBonusFromDefReductionCap = (
  baseDef: number,
  defReduction: number,
): number => {
  return Math.max(0, DEF_MIN - (baseDef - defReduction));
};

/** Enemy ARM for a swing: the buff-reduced base minus any earlier GB They Ain't Tough. */
export const armorForAttackRow = (
  attacker: AttackerData,
  baseArmor: number,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  activeBaseCount: number,
): number => {
  const earlierReduction = armorReductionBeforeAttack(
    attacker,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    attackIndex,
    activeBaseCount,
  );

  return Math.max(ARM_MIN, baseArmor - earlierReduction);
};
