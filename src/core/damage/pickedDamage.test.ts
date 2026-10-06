import { describe, expect, it } from 'vitest';
import { pickedDamageForNet } from '@/core/damage/pickedDamage';
import type { WrapPick } from '@/core/playbook/playbook.types';
import {
  makeAttacker,
  NO_MODS,
  NO_SWING_EXTRAS,
  PLAY_DAMAGE,
} from '@/core/testing/fixtures';

describe('pickedDamageForNet', () => {
  const attacker = makeAttacker();

  const damageAt = (picks: WrapPick[], net: number): number => {
    return pickedDamageForNet(attacker, NO_MODS, picks, net, NO_SWING_EXTRAS);
  };

  it('deals the picked line once the roll reaches it', () => {
    expect(damageAt(['two'], 2)).toBe(2);
    expect(damageAt(['two'], 3)).toBe(2);
  });

  it('falls back to the best lower line on a short roll', () => {
    expect(damageAt(['two'], 1)).toBe(1);
    expect(damageAt(['two'], 0)).toBe(0);
  });

  it('resolves wrap slots past the card width', () => {
    expect(damageAt(['four', 'two'], 5)).toBe(5);
    expect(damageAt(['four', 'two'], 6)).toBe(6);
  });
});

describe('play damage in the odds', () => {
  const attacker = makeAttacker({ characterPlays: [PLAY_DAMAGE] });

  it('adds a slot play damage only when the roll reaches that slot line', () => {
    const extras = { playDamageBySlot: [3], chargeTraitDamage: 0 };

    // `gb` costs 3 net: below it the slot falls back to the best lower line.
    expect(pickedDamageForNet(attacker, NO_MODS, ['gb'], 3, extras)).toBe(4);
    expect(pickedDamageForNet(attacker, NO_MODS, ['gb'], 2, extras)).toBe(2);
  });
});
