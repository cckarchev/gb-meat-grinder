import { describe, expect, it } from 'vitest';
import { pickedDamageForNet } from '@/core/damage/pickedDamage';
import { makeAttacker, NO_MODS, PLAY_DAMAGE } from '@/core/testing/fixtures';

describe('pickedDamageForNet', () => {
  const attacker = makeAttacker();

  it('deals the picked line once the roll reaches it', () => {
    expect(pickedDamageForNet(attacker, NO_MODS, ['two'], 2)).toBe(2);
    expect(pickedDamageForNet(attacker, NO_MODS, ['two'], 3)).toBe(2);
  });

  it('falls back to the best lower line on a short roll', () => {
    expect(pickedDamageForNet(attacker, NO_MODS, ['two'], 1)).toBe(1);
    expect(pickedDamageForNet(attacker, NO_MODS, ['two'], 0)).toBe(0);
  });

  it('resolves wrap slots past the card width', () => {
    expect(pickedDamageForNet(attacker, NO_MODS, ['four', 'two'], 5)).toBe(5);
    expect(pickedDamageForNet(attacker, NO_MODS, ['four', 'two'], 6)).toBe(6);
  });
});

describe('play damage in the odds', () => {
  const attacker = makeAttacker({ characterPlays: [PLAY_DAMAGE] });

  it('adds a slot play damage only when the roll reaches that slot line', () => {
    const extras = { playDamageBySlot: [3], chargeDamage: 0 };

    // `gb` costs 3 net: below it the slot falls back to the best lower line.
    expect(pickedDamageForNet(attacker, NO_MODS, ['gb'], 3, extras)).toBe(4);
    expect(pickedDamageForNet(attacker, NO_MODS, ['gb'], 2, extras)).toBe(2);
  });
});
