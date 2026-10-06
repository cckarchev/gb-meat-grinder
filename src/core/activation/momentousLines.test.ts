import { describe, expect, it } from 'vitest';
import {
  momentousLineStyle,
  momentumEarnedBySwing,
  pickGeneratesMomentum,
} from '@/core/activation/momentousLines';
import {
  makeAttacker,
  modsWith,
  NO_MODS,
  TEAMMATE_GUILD,
} from '@/core/testing/fixtures';

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

describe('a buff that makes damage results momentous', () => {
  const attacker = makeAttacker({
    guild: TEAMMATE_GUILD,
    playbook: [
      {
        netSuccesses: 1,
        results: [
          { id: 'plain1', label: '1', damage: 1 },
          { id: 'plainPush', label: '>', damage: 0 },
        ],
      },
    ],
  });

  const EFFORT = modsWith({ buffs: { effort: true } });

  it('makes a non-momentous damage result earn momentum', () => {
    expect(momentousLineStyle(attacker, 'plain1', NO_MODS)).toBe('none');
    expect(momentousLineStyle(attacker, 'plain1', EFFORT)).toBe('heat');
    expect(momentumEarnedBySwing(attacker, ['plain1'], EFFORT)).toBe(1);
  });

  it('leaves results without printed damage alone', () => {
    expect(momentousLineStyle(attacker, 'plainPush', EFFORT)).toBe('none');
  });

  it('still earns nothing when the damage is zeroed', () => {
    const zeroed = modsWith({ toughHide: true, buffs: { effort: true } });

    expect(momentousLineStyle(attacker, 'plain1', zeroed)).toBe('zeroed');
  });
});

describe('momentous results without printed damage', () => {
  const attacker = makeAttacker({
    playbook: [
      {
        netSuccesses: 1,
        results: [
          { id: 'mgb', label: 'GB', damage: 0, momentum: true },
          { id: 'm1', label: '1', damage: 1, momentum: true },
        ],
      },
    ],
  });

  it('always earn momentum and show as heat', () => {
    expect(momentousLineStyle(attacker, 'mgb', TOUGH_HIDE)).toBe('heat');
    expect(pickGeneratesMomentum(attacker, 'mgb', NO_MODS)).toBe(true);
  });

  it('leave a zeroed damage result without momentum', () => {
    expect(momentousLineStyle(attacker, 'm1', TOUGH_HIDE)).toBe('zeroed');
    expect(pickGeneratesMomentum(attacker, 'm1', TOUGH_HIDE)).toBe(false);
  });
});
