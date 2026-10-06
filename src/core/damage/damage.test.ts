import { describe, expect, it } from 'vitest';
import {
  activeTraitFlatDamage,
  effectiveEnemyDef,
  effectivePlaybookDamage,
  effectivePlayDamage,
  playbookDamageBonusSum,
} from '@/core/damage/damage';
import {
  makeAttacker,
  modsWith,
  NO_MODS,
  PASSIVE_TRAIT,
  TEAMMATE_GUILD,
} from '@/core/testing/fixtures';
import { dontFearTheReaper } from '@/data/characterTraits';

const TOUGH_HIDE = modsWith({ toughHide: true });

describe('buffs and damage', () => {
  const attacker = makeAttacker();

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

  it('applies a playbook-only bonus to playbook damage but not to play damage', () => {
    const butcher = makeAttacker({ guild: TEAMMATE_GUILD });
    const carve = modsWith({ buffs: { carve: true } });

    expect(effectivePlaybookDamage(butcher, 2, carve)).toBe(3);
    expect(effectivePlayDamage(butcher, 2, carve)).toBe(2);
  });

  it('applies an any-damage bonus to play damage too', () => {
    const sharp = modsWith({ buffs: { sharp: true } });

    expect(effectivePlayDamage(attacker, 2, sharp)).toBe(3);
    expect(effectivePlayDamage(attacker, 2, TOUGH_HIDE)).toBe(1);
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
