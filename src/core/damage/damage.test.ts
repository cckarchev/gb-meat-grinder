import { describe, expect, it } from 'vitest';
import {
  availableBuffs,
  effectiveArmor,
  effectiveEnemyDef,
  effectivePlaybookDamage,
  playbookDamageBonusSum,
  specialAbilityFlatDamage,
} from '@/core/damage/damage';
import { makeAttacker, modsWith, NO_MODS } from '@/core/testing/fixtures';

const TOUGH_HIDE = modsWith({ toughHide: true });

describe('buffs and damage', () => {
  const attacker = makeAttacker();

  it('excludes buffs the model is the source of', () => {
    const excluding = makeAttacker({ excludedGuildBuffs: ['sunder'] });

    expect(availableBuffs(excluding).map((b) => b.id)).toEqual([
      'sharp',
      'condition',
    ]);
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

  it('reduces ARM by active buffs, floored at 0', () => {
    const sunder = modsWith({ buffs: { sunder: true } });

    expect(effectiveArmor(attacker, 2, sunder)).toBe(1);
    expect(effectiveArmor(attacker, 0, sunder)).toBe(0);
  });

  it('lowers DEF for Knocked Down and Snared without a floor', () => {
    expect(effectiveEnemyDef(4, true, true)).toBe(2);
    expect(effectiveEnemyDef(2, true, true)).toBe(0);
    expect(effectiveEnemyDef(7, false, false)).toBe(6);
  });

  it('adds toggled special ability damage', () => {
    const withAbilities = makeAttacker({
      specialAbilities: [
        { id: 'a', label: 'A', tooltip: '', flatDamage: 2 },
        { id: 'b', label: 'B', tooltip: '', flatDamage: 3 },
      ],
    });

    expect(specialAbilityFlatDamage(withAbilities, { b: true })).toBe(3);
    expect(specialAbilityFlatDamage(attacker, { b: true })).toBe(0);
  });
});
