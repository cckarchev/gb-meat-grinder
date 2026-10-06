import { describe, expect, it } from 'vitest';
import {
  activatableTraits,
  activatedTraits,
  availableBuffs,
  guildBuffIsExcluded,
  guildBuffsFor,
  joinTraitLabels,
} from '@/core/attackers/buffsAndTraits';
import {
  makeAttacker,
  PASSIVE_TRAIT,
  TEST_GUILD,
} from '@/core/testing/fixtures';
import { dontFearTheReaper } from '@/data/characterTraits';

describe('guild buff exclusion', () => {
  const attacker = makeAttacker();

  it('excludes buffs the model is the source of', () => {
    const excluding = makeAttacker({ excludedGuildBuffs: ['sunder'] });

    expect(availableBuffs(excluding).map((buff) => buff.id)).toEqual([
      'sharp',
      'condition',
    ]);
  });

  it('tells whether one buff is excluded for the model', () => {
    const excluding = makeAttacker({ excludedGuildBuffs: ['sunder'] });

    expect(guildBuffIsExcluded(excluding, 'sunder')).toBe(true);
    expect(guildBuffIsExcluded(excluding, 'sharp')).toBe(false);
    expect(guildBuffIsExcluded(attacker, 'sunder')).toBe(false);
  });
});

describe('guild buff sides', () => {
  const attacker = makeAttacker({
    guild: {
      ...TEST_GUILD,
      buffs: [
        { id: 'pump', label: 'Pump', tooltip: '', damageBonus: 1 },
        {
          id: 'crack',
          label: 'Crack',
          tooltip: '',
          target: 'enemy',
          armorReduction: 1,
        },
      ],
    },
    excludedGuildBuffs: ['crack'],
  });

  it('splits buffs by side, keeping excluded ones for the UI to disable', () => {
    expect(guildBuffsFor(attacker, 'attacker').map((buff) => buff.id)).toEqual([
      'pump',
    ]);
    expect(guildBuffsFor(attacker, 'enemy').map((buff) => buff.id)).toEqual([
      'crack',
    ]);
  });
});

describe('activated traits', () => {
  const attacker = makeAttacker({
    characterTraits: [dontFearTheReaper, PASSIVE_TRAIT],
  });

  it('lists only the traits the user can activate', () => {
    expect(activatableTraits(attacker)).toEqual([dontFearTheReaper]);
  });

  it('keeps the activatable traits that are toggled on', () => {
    expect(activatedTraits(attacker, {})).toEqual([]);
    expect(activatedTraits(attacker, { passive: true })).toEqual([]);
    expect(activatedTraits(attacker, { dontFearTheReaper: true })).toEqual([
      dontFearTheReaper,
    ]);
  });

  it('joins trait labels for a tooltip line', () => {
    expect(joinTraitLabels([dontFearTheReaper, PASSIVE_TRAIT])).toBe(
      `${dontFearTheReaper.label} + Passive`,
    );
  });
});
