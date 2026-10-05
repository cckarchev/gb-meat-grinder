/** Per-swing TAC, DEF and ARM after everything earlier swings carried over. */

import { activationAttackIndices } from '@/core/attacks/attackRows';
import { maxNetSuccessesForRoll } from '@/core/damage/probability';
import type {
  AttackPlan,
  AttackPlanClampParams,
} from '@/core/plan/attackPlan.types';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  armorReductionBeforeAttack,
  coverSwingClockIndices,
  rowEffectsForPick,
  wrapPickClearsCover,
} from '@/core/playbook/rowEffects';
import {
  BONUS_TIME_TAC_BONUS,
  COVER_TAC_PENALTY,
  DEF_MAX,
  DEF_MIN,
  DEFENSIVE_STANCE_DEF_BONUS,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const CHARGE_TAC_BONUS = 4;

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

/**
 * Cover: −1 TAC on this attack’s dice pool while the enemy is in terrain.
 * Push (>) or double push (>>) on any **earlier** attack in activation order
 * (base → berserker → …) clears that terrain benefit on later swings.
 */
export const coverTacPenaltyForAttack = (
  attacker: AttackerData,
  enemyHasCover: boolean,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  activeBaseCount: number,
): number => {
  if (!enemyHasCover) {
    return 0;
  }

  /* Use fixed base → berserker clock so > / >> are never skipped when a berserker
   * row is omitted from `activationAttackIndices` (damage-gated). */
  const clock = coverSwingClockIndices(attacker, activeBaseCount);
  const pos = clock.indexOf(attackIndex);

  if (pos < 0) {
    return COVER_TAC_PENALTY;
  }

  for (let p = 0; p < pos; p++) {
    const j = clock[p];
    const row = wrapPicks[j];

    if (!row?.length) {
      continue;
    }

    for (let k = 0; k < row.length; k++) {
      if (wrapPickClearsCover(attacker, row[k])) {
        return 0;
      }
    }
  }

  return COVER_TAC_PENALTY;
};

/**
 * Modifiers from all picks on attacks strictly before `attackIndex` in activation order
 * (base → its berserker → next base → …).
 */
export const modifiersBeforeAttack = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): { tacBonus: number; defReduction: number } => {
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  const targetPos = order.indexOf(attackIndex);

  if (targetPos < 0) {
    return { tacBonus: 0, defReduction: 0 };
  }

  let tacBonus = 0;
  let defReduction = 0;

  for (let oi = 0; oi < targetPos; oi++) {
    const j = order[oi];

    for (let k = 0; k < wrapPicks[j].length; k++) {
      if (wrapPicks[j][k] == null) {
        continue;
      }

      const m = rowEffectsForPick(
        attacker,
        wrapPicks,
        characterPlayPicks,
        j,
        k,
        damageMods,
        activeBaseCount,
      );

      tacBonus += m.tacBonusForLater;
      defReduction += m.defReductionForLater;
    }
  }

  return { tacBonus, defReduction };
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

const tacForAttackRow = (
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

/** Highest net successes reachable in one roll on this row (TAC − ARM cap). */
export const maxPlaybookColumnForRow = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  chargeAttackIndex: number,
  armor: number,
  enemyHasCover: boolean,
  enemyDefensiveStance: boolean,
  damageMods: PlaybookDamageMods,
  baseDef: number,
  bonusTimeByAttack: readonly boolean[],
  initialTacModifier: number,
  activeBaseCount: number,
): number => {
  const tac = tacForAttackRow(
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

  const rowArmor = armorForAttackRow(
    attacker,
    armor,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    attackIndex,
    activeBaseCount,
  );

  return maxNetSuccessesForRoll(tac, rowArmor);
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
  return Math.max(
    0,
    baseArmor -
      armorReductionBeforeAttack(
        attacker,
        wrapPicks,
        characterPlayPicks,
        damageMods,
        attackIndex,
        activeBaseCount,
      ),
  );
};

/** `maxPlaybookColumnForRow` for a plan, reading the bounds from clamp params. */
export const maxPlaybookColumnForPlan = (
  plan: AttackPlan,
  attackIndex: number,
  params: AttackPlanClampParams,
): number => {
  return maxPlaybookColumnForRow(
    params.attacker,
    plan.wrapPicks,
    plan.characterPlayPicks,
    attackIndex,
    params.chargeAttackIndex,
    params.armor,
    params.enemyHasCover,
    params.enemyDefensiveStance,
    params.damageMods,
    params.enemyDef,
    params.bonusTimeByAttack,
    params.initialTacModifier,
    params.activeBaseCount,
  );
};
