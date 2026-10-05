import { describe, expect, it } from 'vitest';
import {
  projectSwings,
  type SwingProjectionInput,
} from '@/core/swingProjections';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';
import type { AttackRollContext } from '@/types/core/attackSequence';

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
  return {
    attacker: makeAttacker(),
    attacks: [swing(0), swing(1)],
    killingBlowIndex: -1,
    wrapPicks: [['two'], ['two']],
    bonusTimeByAttack: [false, false],
    damageMods: NO_MODS,
    specialAbilities: {},
    startingMomentum: 0,
    activeBaseCount: 2,
    targetHp: 10,
    ...overrides,
  };
};

describe('projectSwings', () => {
  it('tracks HP left and momentum after each swing', () => {
    const projection = projectSwings(input());

    expect(projection.remainingHp).toEqual([8, 6]);
    expect(projection.momentum).toEqual([1, 2]);
    expect(projection.bonusTimePool).toEqual([0, 1]);
  });

  it('applies special-ability damage before the first swing', () => {
    const attacker = makeAttacker({
      specialAbilities: [
        { id: 'gore', label: 'Gore', tooltip: '', flatDamage: 3 },
      ],
    });

    const projection = projectSwings(
      input({ attacker, specialAbilities: { gore: true } }),
    );

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
