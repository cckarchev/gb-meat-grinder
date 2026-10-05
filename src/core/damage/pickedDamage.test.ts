import { describe, expect, it } from 'vitest';
import { pickedDamageForNet } from '@/core/damage/pickedDamage';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

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
