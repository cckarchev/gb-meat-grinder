import { describe, expect, it } from 'vitest';
import {
  momentousLineStyle,
  momentumEarnedBySwing,
  pickGeneratesMomentum,
} from '@/core/activation/momentousLines';
import { makeAttacker, modsWith, NO_MODS } from '@/core/testing/fixtures';

const TOUGH_HIDE = modsWith({ toughHide: true });

describe('momentous lines', () => {
  const attacker = makeAttacker({ inf: 3 });

  it('marks momentous lines by their effective damage', () => {
    expect(momentousLineStyle(attacker, 'one', NO_MODS)).toBe('heat');
    expect(momentousLineStyle(attacker, 'one', TOUGH_HIDE)).toBe('zeroed');
    expect(momentousLineStyle(attacker, 'dodge', NO_MODS)).toBe('none');
    expect(pickGeneratesMomentum(attacker, 'one', TOUGH_HIDE)).toBe(false);
    expect(pickGeneratesMomentum(attacker, null, NO_MODS)).toBe(false);
  });
});

describe('momentumEarnedBySwing', () => {
  const attacker = makeAttacker();

  it('earns one momentum per momentous pick that deals damage', () => {
    expect(momentumEarnedBySwing(attacker, ['two', 'one'], NO_MODS)).toBe(2);
    expect(momentumEarnedBySwing(attacker, ['push', null], NO_MODS)).toBe(0);
  });

  it('skips momentous picks Tough Hide zeroes out', () => {
    expect(momentumEarnedBySwing(attacker, ['two', 'one'], TOUGH_HIDE)).toBe(1);
  });
});
