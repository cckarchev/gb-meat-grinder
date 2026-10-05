import { describe, expect, it } from 'vitest';
import { maxPlaybookColumnForPlan } from '@/core/attacks/maxPlaybookColumn';
import type { AttackPlanClampParams } from '@/core/plan/attackPlan.types';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

describe('maxPlaybookColumnForPlan', () => {
  const params = (tac: number): AttackPlanClampParams => {
    return {
      attacker: makeAttacker({ tac }),
      chargeAttackIndex: NO_ATTACK_INDEX,
      armor: 0,
      enemyHasCover: false,
      enemyDefensiveStance: false,
      damageMods: NO_MODS,
      enemyDef: 4,
      bonusTimeByAttack: [false, false],
      initialTacModifier: 0,
      enemyKnockedDown: false,
      activeBaseCount: 2,
    };
  };

  const emptyPlan = {
    wrapPicks: [[null], [null]],
    characterPlayPicks: [[null], [null]],
  };

  it('reads the clamp params to find the column a row reaches', () => {
    // TAC vs ARM 0 with no other modifiers: the row reaches column TAC.
    expect(maxPlaybookColumnForPlan(emptyPlan, 0, params(4))).toBe(4);
    expect(maxPlaybookColumnForPlan(emptyPlan, 0, params(2))).toBe(2);
  });
});
