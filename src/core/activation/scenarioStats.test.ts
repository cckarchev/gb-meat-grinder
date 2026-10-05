import { describe, expect, it } from 'vitest';
import {
  type ScenarioStatsInput,
  scenarioEffectiveStats,
} from '@/core/activation/scenarioStats';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const attacker = makeAttacker();

const input = (
  overrides: Partial<ScenarioStatsInput> = {},
): ScenarioStatsInput => {
  return {
    influence: attacker.inf,
    charging: false,
    chargeAttackIndex: 1,
    armor: 3,
    damageMods: NO_MODS,
    enemyDef: 5,
    enemyKnockedDown: false,
    enemySnared: false,
    gangingUp: 0,
    crowdingOut: 0,
    ...overrides,
  };
};

describe('scenarioEffectiveStats', () => {
  it('buys one base attack per influence when not charging', () => {
    const stats = scenarioEffectiveStats(attacker, input());

    expect(stats.activeBaseCount).toBe(attacker.inf);
    expect(stats.effectiveChargeAttackIndex).toBe(NO_ATTACK_INDEX);
  });

  it('uses the chosen charge row while charging', () => {
    const stats = scenarioEffectiveStats(attacker, input({ charging: true }));

    expect(stats.effectiveChargeAttackIndex).toBe(1);
  });

  it('applies Knocked Down and Snared to DEF and keeps the printed ARM without buffs', () => {
    const stats = scenarioEffectiveStats(
      attacker,
      input({ enemyKnockedDown: true, enemySnared: true }),
    );

    expect(stats.effectiveEnemyDef).toBe(3);
    expect(stats.effectiveArmor).toBe(3);
  });

  it('nets Ganging Up against Crowding Out', () => {
    const stats = scenarioEffectiveStats(
      attacker,
      input({ gangingUp: 2, crowdingOut: 1 }),
    );

    expect(stats.initialTacModifier).toBe(1);
  });
});
