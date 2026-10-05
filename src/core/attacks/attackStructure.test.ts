import { describe, expect, it } from 'vitest';
import {
  activeBaseAttackCount,
  attackArraySize,
  berserkerRowOffset,
  chargeInfluenceCost,
  clampChargeAttackIndex,
  maxBaseAttackCount,
} from '@/core/attacks/attackStructure';
import { makeAttacker } from '@/core/testing/fixtures';

const CHARGING = true;
const NOT_CHARGING = false;

describe('chargeInfluenceCost', () => {
  it('is 0 when not charging', () => {
    expect(chargeInfluenceCost(makeAttacker(), NOT_CHARGING)).toBe(0);
  });

  it('is 2 for a normal charge and free for Furious models', () => {
    expect(chargeInfluenceCost(makeAttacker(), CHARGING)).toBe(2);

    expect(chargeInfluenceCost(makeAttacker({ furious: true }), CHARGING)).toBe(
      0,
    );
  });
});

describe('activeBaseAttackCount', () => {
  it('buys one attack per influence when not charging', () => {
    expect(activeBaseAttackCount(makeAttacker(), 3, NOT_CHARGING)).toBe(3);
  });

  it('spends 2 influence on a normal charge', () => {
    expect(activeBaseAttackCount(makeAttacker(), 3, CHARGING)).toBe(2);
    expect(activeBaseAttackCount(makeAttacker(), 1, CHARGING)).toBe(1);
  });

  it('charges for free when Furious', () => {
    const furious = makeAttacker({ furious: true });

    expect(activeBaseAttackCount(furious, 3, CHARGING)).toBe(4);
  });

  it('adds a free Feral attack', () => {
    const feral = makeAttacker({ feral: true });

    expect(activeBaseAttackCount(feral, 0, NOT_CHARGING)).toBe(1);
  });
});

describe('array layout', () => {
  it('reserves INF plus the free Furious and Feral attacks', () => {
    const attacker = makeAttacker({ inf: 2, furious: true, feral: true });

    expect(maxBaseAttackCount(attacker)).toBe(4);
    expect(berserkerRowOffset(attacker)).toBe(4);
    expect(attackArraySize(attacker)).toBe(4);
  });

  it('doubles the rows for Berserker models', () => {
    const attacker = makeAttacker({ inf: 3, berserker: true });

    expect(attackArraySize(attacker)).toBe(6);
  });
});

describe('clampChargeAttackIndex', () => {
  it('keeps an index inside the active base attacks', () => {
    expect(clampChargeAttackIndex(1, 3)).toBe(1);
  });

  it('pulls an index past the last base attack back onto it', () => {
    expect(clampChargeAttackIndex(4, 2)).toBe(1);
  });

  it('never goes below the first attack, even with no base attacks', () => {
    expect(clampChargeAttackIndex(-1, 3)).toBe(0);
    expect(clampChargeAttackIndex(2, 0)).toBe(0);
  });
});
