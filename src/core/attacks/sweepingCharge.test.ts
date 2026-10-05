import { describe, expect, it } from 'vitest';
import { deriveSimulation } from '@/core/activation/simulation';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import { attackArraySize } from '@/core/attacks/attackStructure';
import { pickedDamageForNet } from '@/core/damage/pickedDamage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import {
  CONDITION_GUILD,
  makeAttacker,
  modsWith,
  NO_MODS,
  planOf,
} from '@/core/testing/fixtures';
import { searingStrike, sweepingCharge } from '@/data/characterTraits';

const CHARGE_ROW = 0;
const SWINGS = 3;

/** A charge plus two bought attacks: 2 influence for the charge, 2 for attacks. */
const INFLUENCE = 4;

const sweeper = makeAttacker({
  inf: INFLUENCE,
  guild: CONDITION_GUILD,
  characterTraits: [searingStrike, sweepingCharge],
});

const timelineFor = (plan: AttackPlan, mods = NO_MODS) => {
  return activationTimeline(plan, {
    attacker: sweeper,
    damageMods: mods,
    activeBaseCount: SWINGS,
    chargeAttackIndex: CHARGE_ROW,
  });
};

describe('Sweeping Charge in the plan', () => {
  it('adds 3 to a charge that picks a damage result', () => {
    expect(
      timelineFor(planOf([['one'], ['one'], ['one']]))[0].chargeDamage,
    ).toBe(3);
  });

  it('does not trigger on a charge that picks no damage result', () => {
    const timeline = timelineFor(planOf([['push'], ['one'], ['one']]));

    expect(timeline[0].chargeDamage).toBe(0);
    expect(timeline.map((state) => state.effectsBefore.armorReduction)).toEqual(
      [0, 0, 1],
    );
  });

  it('triggers on a damage result zeroed by Tough Hide, and lights Searing Strike', () => {
    const timeline = timelineFor(
      planOf([['one'], ['two'], ['two']]),
      modsWith({ toughHide: true }),
    );

    expect(timeline[0].chargeDamage).toBe(3);
    expect(timeline.map((state) => state.effectsBefore.armorReduction)).toEqual(
      [0, 1, 1],
    );
  });

  it('only applies on the charge swing', () => {
    const timeline = timelineFor(planOf([['one'], ['one'], ['one']]));

    expect(timeline[1].chargeDamage).toBe(0);
  });
});

describe('Sweeping Charge in the odds', () => {
  const extras = { playDamageBySlot: [], chargeTraitDamage: 3 };

  it('adds 3 when the roll reaches the picked damage line', () => {
    expect(pickedDamageForNet(sweeper, NO_MODS, ['two'], 2, extras)).toBe(5);
  });

  it('adds 3 when a short roll falls back to a lower damage line', () => {
    // `four` costs 4; with 1 net the slot falls back to `one`.
    expect(pickedDamageForNet(sweeper, NO_MODS, ['four'], 1, extras)).toBe(4);
  });

  it('adds 3 when a short roll on a damage-less pick falls back to a damage line', () => {
    // Picked `push` (net 2, no damage): the plan projects no Sweeping Charge,
    // but 1 net falls back to `one`, a damage result, so the odds count it.
    const projected = timelineFor(planOf([['push'], ['one'], ['one']]));

    expect(projected[CHARGE_ROW].chargeDamage).toBe(0);
    expect(pickedDamageForNet(sweeper, NO_MODS, ['push'], 1, extras)).toBe(4);
  });

  it('adds nothing when the roll reaches a line without damage', () => {
    expect(pickedDamageForNet(sweeper, NO_MODS, ['push'], 2, extras)).toBe(0);
  });

  it('adds nothing on a miss', () => {
    expect(pickedDamageForNet(sweeper, NO_MODS, ['two'], 0, extras)).toBe(0);
  });
});

describe('Sweeping Charge against a Resilient target', () => {
  it('neither deals damage nor lights Searing Strike on the ignored charge', () => {
    const rows = attackArraySize(sweeper);
    const picks = [['one'], ['one'], ['one']];

    while (picks.length < rows) {
      picks.push([]);
    }

    const derived = deriveSimulation(sweeper, {
      enemyDef: 4,
      armor: 2,
      hp: 20,
      influence: sweeper.inf,
      charging: true,
      chargeAttackIndex: CHARGE_ROW,
      enemyHasCover: false,
      enemyDefensiveStance: false,
      enemyKnockedDown: false,
      enemySnared: false,
      enemyResilience: true,
      gangingUp: 0,
      crowdingOut: 0,
      bonusTimeByAttack: picks.map(() => false),
      damageMods: NO_MODS,
      activeTraits: {},
      attackPlan: planOf(picks),
    });

    expect(derived.timeline[0].chargeDamage).toBe(0);
    expect(derived.timeline[1].effectsBefore.armorReduction).toBe(0);
  });
});
