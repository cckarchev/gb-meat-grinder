/** Enemy DEF and ARM for a swing after stance, conditions and earlier plays. */

import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { armorReductionBeforeAttack } from '@/core/playbook/rowEffects';
import {
  DEF_MAX,
  DEF_MIN,
  DEFENSIVE_STANCE_DEF_BONUS,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Effective enemy DEF stat for this row (charge + Defensive Stance = +1, capped). */
export const enemyDefBaseForAttackRow = (
  enemyDef: number,
  attackIndex: number,
  chargeAttackIndex: number,
  enemyDefensiveStance: boolean,
  activeBaseCount: number,
): number => {
  const stanceBonus =
    enemyDefensiveStance &&
    attackIndex < activeBaseCount &&
    attackIndex === chargeAttackIndex
      ? DEFENSIVE_STANCE_DEF_BONUS
      : 0;

  return Math.min(DEF_MAX, enemyDef + stanceBonus);
};

export const effectiveDefMinRoll = (
  baseDef: number,
  defReduction: number,
): number => {
  return Math.max(DEF_MIN, Math.min(DEF_MAX, baseDef - defReduction));
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

  return Math.max(0, baseArmor - earlierReduction);
};
