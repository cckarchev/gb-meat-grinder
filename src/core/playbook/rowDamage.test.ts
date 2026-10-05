import { describe, expect, it } from 'vitest';
import { damageModifierBreakdownWrap } from '@/core/playbook/rowDamage';
import { makeAttacker, modsWith } from '@/core/testing/fixtures';

describe('damageModifierBreakdownWrap', () => {
  it('splits card damage into Tough Hide and per-buff contributions', () => {
    const attacker = makeAttacker();
    const mods = modsWith({ toughHide: true, buffs: { sharp: true } });

    expect(
      damageModifierBreakdownWrap(attacker, [['two', 'gb'], ['one']], mods, 2),
    ).toEqual({
      rawCardDamage: 4,
      toughHideReduction: 3,
      buffBonuses: [
        { id: 'sharp', label: 'Sharp', bonus: 3 },
        { id: 'sunder', label: 'Sunder', bonus: 0 },
        { id: 'condition', label: 'Condition', bonus: 0 },
      ],
      totalEffective: 4,
    });
  });
});
