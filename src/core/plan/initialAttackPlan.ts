/** The empty plan a model starts with, clamped against default enemy stats. */

import {
  activeBaseAttackCount,
  attackArraySize,
} from '@/core/attacks/attackStructure';
import { DEFAULT_PLAYBOOK_DAMAGE_MODS } from '@/core/damage/damage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import { clampAttackPlan } from '@/core/plan/clampAttackPlan';
import {
  defaultCharacterPlayPicksWrap,
  defaultWrapPicks,
} from '@/core/playbook/wrapSlots';
import {
  ARM_DEFAULT,
  DEF_DEFAULT,
  NO_ATTACK_INDEX,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const createInitialAttackPlan = (
  attacker: AttackerData,
  influence: number,
  charging: boolean,
): AttackPlan => {
  const size = attackArraySize(attacker);

  const unclamped: AttackPlan = {
    wrapPicks: defaultWrapPicks(size),
    characterPlayPicks: defaultCharacterPlayPicksWrap(size),
  };

  const noBonusTime = Array.from({ length: size }, () => false);

  return clampAttackPlan(unclamped, {
    attacker,
    chargeAttackIndex: charging ? 0 : NO_ATTACK_INDEX,
    armor: ARM_DEFAULT,
    enemyHasCover: false,
    enemyDefensiveStance: false,
    damageMods: DEFAULT_PLAYBOOK_DAMAGE_MODS,
    enemyDef: DEF_DEFAULT,
    bonusTimeByAttack: noBonusTime,
    initialTacModifier: 0,
    enemyKnockedDown: false,
    activeBaseCount: activeBaseAttackCount(attacker, influence, charging),
  });
};
