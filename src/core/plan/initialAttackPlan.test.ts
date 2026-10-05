import { describe, expect, it } from 'vitest';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import { createInitialAttackPlan } from '@/core/plan/initialAttackPlan';
import { makeAttacker } from '@/core/testing/fixtures';

const attacker = makeAttacker();

const plan = (
  wrapPicks: AttackPlan['wrapPicks'],
  characterPlayPicks: AttackPlan['characterPlayPicks'],
): AttackPlan => {
  return { wrapPicks, characterPlayPicks };
};

describe('createInitialAttackPlan', () => {
  it('starts with empty picks sized to the default roll', () => {
    // TAC 6 vs the default ARM 1: 5 net, which needs two wrap slots.
    expect(createInitialAttackPlan(attacker, 2, false)).toEqual(
      plan(
        [
          [null, null],
          [null, null],
        ],
        [
          [null, null],
          [null, null],
        ],
      ),
    );
  });

  it('starts a charging plan with only the charge row', () => {
    // 2 INF all spent on the charge; TAC 6 + 4 vs ARM 1 = 9 net, three slots.
    expect(createInitialAttackPlan(attacker, 2, true).wrapPicks).toEqual([
      [null, null, null],
      [],
    ]);
  });
});
