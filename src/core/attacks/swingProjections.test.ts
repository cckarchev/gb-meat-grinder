import { describe, expect, it } from 'vitest';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import {
  projectSwings,
  type SwingProjectionInput,
} from '@/core/attacks/swingProjections';
import { rowDamageIfAllHit } from '@/core/playbook/rowDamage';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const swing = (attackIndex: number): AttackRollContext => {
  return {
    attackIndex,
    tac: 2,
    armor: 0,
    defMinRoll: 2,
    pHit: 1,
    netSuccessesNeeded: 2,
    prob: 1,
  };
};

const input = (
  overrides: Partial<SwingProjectionInput> = {},
): SwingProjectionInput => {
  const scenario = {
    attacker: makeAttacker(),
    attacks: [swing(0), swing(1)],
    killingBlowIndex: -1,
    wrapPicks: [['two'], ['two']],
    bonusTimeByAttack: [false, false],
    damageMods: NO_MODS,
    flatDamage: 0,
    startingMomentum: 0,
    activeBaseCount: 2,
    targetHp: 10,
    enemyKnockedDown: false,
    ...overrides,
  };

  // Derived the way `deriveSimulation` does, unless a test pins it.
  const characterPlayPicks = scenario.wrapPicks.map((row) => {
    return row.map(() => null);
  });

  const timeline = activationTimeline(
    { wrapPicks: scenario.wrapPicks, characterPlayPicks },
    {
      attacker: scenario.attacker,
      damageMods: scenario.damageMods,
      activeBaseCount: scenario.activeBaseCount,
      chargeAttackIndex: NO_ATTACK_INDEX,
      targetHp: scenario.targetHp,
      enemyKnockedDown: false,
    },
  );

  const rowDamageIfHit = rowDamageIfAllHit(
    scenario.attacker,
    scenario.wrapPicks,
    scenario.damageMods,
    scenario.activeBaseCount,
    timeline,
  );

  return { timeline, rowDamageIfHit, ...scenario };
};

describe('projectSwings', () => {
  it('tracks HP left and momentum after each swing', () => {
    const projection = projectSwings(input());

    expect(projection.remainingHp).toEqual([8, 6]);
    expect(projection.momentum).toEqual([1, 2]);
    expect(projection.bonusTimePool).toEqual([0, 1]);
  });

  it('applies activated-trait damage before the first swing', () => {
    const projection = projectSwings(input({ flatDamage: 3 }));

    expect(projection.remainingHp).toEqual([5, 3]);
  });

  it('never drops HP below zero', () => {
    expect(projectSwings(input({ targetHp: 3 })).remainingHp).toEqual([1, 0]);
  });

  it('adds the killing blow and freezes momentum after it', () => {
    const projection = projectSwings(
      input({ targetHp: 2, killingBlowIndex: 0 }),
    );

    expect(projection.momentum).toEqual([2, 2]);
  });
});
