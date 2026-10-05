import { describe, expect, it } from 'vitest';
import { maxPlaybookColumnForRow } from '@/core/attacks/maxPlaybookColumn';
import type { AttackPlanClampParams } from '@/core/plan/attackPlan.types';
import { makeAttacker, makeRollParams } from '@/core/testing/fixtures';

describe('maxPlaybookColumnForRow', () => {
  const params = (tac: number): AttackPlanClampParams => {
    return {
      ...makeRollParams({ attacker: makeAttacker({ tac }) }),
      enemyKnockedDown: false,
    };
  };

  const emptyPlan = {
    wrapPicks: [[null], [null]],
    characterPlayPicks: [[null], [null]],
  };

  it('reads the clamp params to find the column a row reaches', () => {
    // TAC vs ARM 0 with no other modifiers: the row reaches column TAC.
    expect(maxPlaybookColumnForRow(emptyPlan, 0, params(4))).toBe(4);
    expect(maxPlaybookColumnForRow(emptyPlan, 0, params(2))).toBe(2);
  });
});
