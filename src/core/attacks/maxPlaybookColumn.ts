/** Highest playbook column a swing can reach, from its TAC and the enemy ARM. */

import { armorForAttackRow } from '@/core/attacks/swingDefense';
import { tacForAttackRow } from '@/core/attacks/swingTac';
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
import type { AttackerData } from '@/data/attackers/attacker.types';

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
