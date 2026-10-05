import { describe, expect, it } from 'vitest';
import {
  momentousLineStyle,
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
