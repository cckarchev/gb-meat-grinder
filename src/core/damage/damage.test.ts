import { describe, expect, it } from 'vitest';
import {
  activatableTraits,
  activatedTraits,
  activeTraitFlatDamage,
  availableBuffs,
  effectiveEnemyDef,
  effectivePlaybookDamage,
  guildBuffIsExcluded,
  guildBuffsFor,
  joinTraitLabels,
  playbookDamageBonusSum,
} from '@/core/damage/damage';
import {
  makeAttacker,
  modsWith,
  NO_MODS,
  TEST_GUILD,
} from '@/core/testing/fixtures';
import type { CharacterTrait } from '@/data/characterTraits';
import { dontFearTheReaper } from '@/data/characterTraits';

/** A passive trait with flat damage that must never count as activated damage. */
const PASSIVE_TRAIT: CharacterTrait = {
  id: 'passive',
  label: 'Passive',
  tooltip: '',
  flatDamage: 3,
};

const TOUGH_HIDE = modsWith({ toughHide: true });

describe('buffs and damage', () => {
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

  it('sums the damage bonus of active buffs only', () => {
    expect(playbookDamageBonusSum(attacker, NO_MODS)).toBe(0);

    expect(
      playbookDamageBonusSum(attacker, modsWith({ buffs: { sharp: true } })),
    ).toBe(1);
  });

  it('applies Tough Hide and buffs only to lines with card damage', () => {
    expect(effectivePlaybookDamage(attacker, 0, TOUGH_HIDE)).toBe(0);
    expect(effectivePlaybookDamage(attacker, 2, TOUGH_HIDE)).toBe(1);
    expect(effectivePlaybookDamage(attacker, 1, TOUGH_HIDE)).toBe(0);

    expect(
      effectivePlaybookDamage(
        attacker,
        2,
        modsWith({ toughHide: true, buffs: { sharp: true } }),
      ),
    ).toBe(2);
  });

  it('ignores Tough Hide with a Condition Damage buff', () => {
    const conditionMods = modsWith({
      toughHide: true,
      buffs: { condition: true },
    });

    expect(effectivePlaybookDamage(attacker, 2, conditionMods)).toBe(2);
  });

  it('lowers DEF for Knocked Down and Snared without a floor', () => {
    expect(effectiveEnemyDef(4, true, true)).toBe(2);
    expect(effectiveEnemyDef(2, true, true)).toBe(0);
    expect(effectiveEnemyDef(7, false, false)).toBe(6);
  });

  it('adds the flat damage of activated traits only', () => {
    const attacker = makeAttacker({
      characterTraits: [dontFearTheReaper, PASSIVE_TRAIT],
    });

    expect(activeTraitFlatDamage(attacker, {})).toBe(0);
    expect(activeTraitFlatDamage(attacker, { dontFearTheReaper: true })).toBe(
      3,
    );
    expect(activeTraitFlatDamage(attacker, { passive: true })).toBe(0);
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
