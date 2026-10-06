import { describe, expect, it } from 'vitest';
import { gangingUpRange } from '@/core/activation/gangingUp';
import {
  makeAttacker,
  modsWith,
  NO_MODS,
  TEAMMATE_GUILD,
} from '@/core/testing/fixtures';
import { GANGING_UP_RANGE } from '@/data/attackers/statRanges';

describe('gangingUpRange', () => {
  const attacker = makeAttacker();

  it('is the attacker range when no named model engages', () => {
    expect(gangingUpRange(attacker, NO_MODS)).toEqual(GANGING_UP_RANGE);
  });

  it('starts at 1 while an Assist model engages the target', () => {
    const engaged = modsWith({ assistEngaged: true });

    expect(gangingUpRange(attacker, engaged)).toEqual({
      min: 1,
      max: GANGING_UP_RANGE.max,
    });
  });

  it('starts at the minimum an active guild buff needs', () => {
    const farmer = makeAttacker({ guild: TEAMMATE_GUILD });
    const gang = modsWith({ buffs: { gang: true } });

    expect(gangingUpRange(farmer, gang).min).toBe(1);
  });

  it('ignores the minimum of a buff the model is excluded from', () => {
    const excluded = makeAttacker({
      guild: TEAMMATE_GUILD,
      excludedGuildBuffs: ['gang'],
    });
    const gang = modsWith({ buffs: { gang: true } });

    expect(gangingUpRange(excluded, gang).min).toBe(GANGING_UP_RANGE.min);
  });
});
