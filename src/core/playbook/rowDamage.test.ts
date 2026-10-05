import { describe, expect, it } from 'vitest';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import {
  characterPlayDamageSources,
  damageModifierBreakdown,
  rowDamageIfAllHit,
} from '@/core/playbook/rowDamage';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import {
  makeAttacker,
  modsWith,
  NO_MODS,
  PLAY_DAMAGE,
} from '@/core/testing/fixtures';

describe('damageModifierBreakdown', () => {
  it('splits card damage into Tough Hide and per-buff contributions', () => {
    const attacker = makeAttacker();
    const mods = modsWith({ toughHide: true, buffs: { sharp: true } });
    const wrapPicks = [['two', 'gb'], ['one']];

    const timeline = activationTimeline(
      { wrapPicks, characterPlayPicks: [[null, null], [null]] },
      {
        attacker,
        damageMods: mods,
        activeBaseCount: 2,
        chargeAttackIndex: NO_ATTACK_INDEX,
      },
    );

    expect(
      damageModifierBreakdown(attacker, wrapPicks, mods, 2, timeline),
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

describe('play damage in the all-hit projection', () => {
  it('adds the triggered play damage to the swing', () => {
    const attacker = makeAttacker({ characterPlays: [PLAY_DAMAGE] });
    const wrapPicks = [['gb'], ['gb']];
    const characterPlayPicks = [['playDamage'], ['playDamage']];

    const timeline = activationTimeline(
      { wrapPicks, characterPlayPicks },
      {
        attacker,
        damageMods: NO_MODS,
        activeBaseCount: 2,
        chargeAttackIndex: NO_ATTACK_INDEX,
      },
    );

    // `gb` is 1 card damage; the play adds 3 on the first swing only.
    expect(
      rowDamageIfAllHit(attacker, wrapPicks, NO_MODS, 2, timeline),
    ).toEqual([4, 1]);
  });
});

describe('play damage in the breakdown', () => {
  const attacker = makeAttacker({ characterPlays: [PLAY_DAMAGE] });
  const wrapPicks = [['gb'], []];
  const characterPlayPicks = [['playDamage'], []];
  const sharp = modsWith({ buffs: { sharp: true } });

  const timeline = activationTimeline(
    { wrapPicks, characterPlayPicks },
    {
      attacker,
      damageMods: sharp,
      activeBaseCount: 1,
      chargeAttackIndex: NO_ATTACK_INDEX,
    },
  );

  it('folds a buff lift on the play into that buff line', () => {
    const breakdown = damageModifierBreakdown(
      attacker,
      wrapPicks,
      sharp,
      1,
      timeline,
    );

    // Card 1 + 1 (Sharp), play 3 + 1 (Sharp).
    expect(breakdown.totalEffective).toBe(6);
    expect(
      breakdown.buffBonuses.find((buff) => buff.id === 'sharp')?.bonus,
    ).toBe(2);
  });

  it('reports plays at their printed amount for the tooltip', () => {
    expect(characterPlayDamageSources(timeline, [0])).toEqual([
      { label: 'Play Damage', amount: 3 },
    ]);
  });
});
