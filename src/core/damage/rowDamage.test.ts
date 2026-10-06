import { describe, expect, it } from 'vitest';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import {
  characterPlayDamageSources,
  damageModifierBreakdown,
  rowDamageIfAllHit,
} from '@/core/damage/rowDamage';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import {
  makeAttacker,
  modsWith,
  NEUTRAL_TARGET_HP,
  NO_MODS,
  PLAY_ASSIST,
  PLAY_DAMAGE,
  PLAY_HALF_HEALTH,
  TEAMMATE_GUILD,
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
        targetHp: NEUTRAL_TARGET_HP,
        enemyKnockedDown: false,
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
        targetHp: NEUTRAL_TARGET_HP,
        enemyKnockedDown: false,
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
      targetHp: NEUTRAL_TARGET_HP,
      enemyKnockedDown: false,
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

  it('keeps a playbook-only buff off the play', () => {
    const butcher = makeAttacker({
      guild: TEAMMATE_GUILD,
      characterPlays: [PLAY_DAMAGE],
    });
    const carve = modsWith({ buffs: { carve: true } });

    const carveTimeline = activationTimeline(
      { wrapPicks, characterPlayPicks },
      {
        attacker: butcher,
        damageMods: carve,
        activeBaseCount: 1,
        chargeAttackIndex: NO_ATTACK_INDEX,
        targetHp: NEUTRAL_TARGET_HP,
        enemyKnockedDown: false,
      },
    );

    const breakdown = damageModifierBreakdown(
      butcher,
      wrapPicks,
      carve,
      1,
      carveTimeline,
    );

    // Card 1 + 1 (Carve), play 3 unmodified.
    expect(breakdown.totalEffective).toBe(5);
    expect(
      breakdown.buffBonuses.find((buff) => buff.id === 'carve')?.bonus,
    ).toBe(1);
  });
});

describe('current-HP play damage in the projection and breakdown', () => {
  const attacker = makeAttacker({ characterPlays: [PLAY_HALF_HEALTH] });
  const wrapPicks = [['gb'], []];
  const characterPlayPicks = [['playHalfHealth'], []];
  const toughAndSharp = modsWith({ toughHide: true, buffs: { sharp: true } });
  const targetHp = 10;

  const timeline = activationTimeline(
    { wrapPicks, characterPlayPicks },
    {
      attacker,
      damageMods: toughAndSharp,
      activeBaseCount: 1,
      chargeAttackIndex: NO_ATTACK_INDEX,
      targetHp,
      enemyKnockedDown: false,
    },
  );

  it('adds half the current HP to the swing', () => {
    // Card `gb` 1 (-1 Tough Hide, +1 Sharp), then half of 10 unmodified.
    expect(
      rowDamageIfAllHit(attacker, wrapPicks, toughAndSharp, 1, timeline),
    ).toEqual([6, 0]);
  });

  it('leaves it out of the Tough Hide and buff lines', () => {
    const breakdown = damageModifierBreakdown(
      attacker,
      wrapPicks,
      toughAndSharp,
      1,
      timeline,
    );

    expect(breakdown.totalEffective).toBe(6);
    expect(breakdown.toughHideReduction).toBe(1);
    expect(
      breakdown.buffBonuses.find((buff) => buff.id === 'sharp')?.bonus,
    ).toBe(1);
  });

  it('reports it at the damage it deals for the tooltip', () => {
    expect(characterPlayDamageSources(timeline, [0])).toEqual([
      { label: 'Play Half Health', amount: 5 },
    ]);
  });
});

describe('Assist damage in the projection and breakdown', () => {
  const attacker = makeAttacker({ characterPlays: [PLAY_ASSIST] });
  const mods = modsWith({ assistEngaged: true });
  const wrapPicks = [['gb'], ['two']];

  const timeline = activationTimeline(
    { wrapPicks, characterPlayPicks: [['playAssist'], [null]] },
    {
      attacker,
      damageMods: mods,
      activeBaseCount: 2,
      chargeAttackIndex: NO_ATTACK_INDEX,
      targetHp: NEUTRAL_TARGET_HP,
      enemyKnockedDown: false,
    },
  );

  it('adds +1 DMG to the later playbook damage result only', () => {
    // The fixture's `gb` deals 1: the play does not boost its own swing.
    expect(rowDamageIfAllHit(attacker, wrapPicks, mods, 2, timeline)).toEqual([
      1, 3,
    ]);
  });

  it('itemizes it on its own Assist line', () => {
    const breakdown = damageModifierBreakdown(
      attacker,
      wrapPicks,
      mods,
      2,
      timeline,
    );

    const lifted = breakdown.buffBonuses.filter((line) => line.bonus > 0);

    expect(breakdown.rawCardDamage).toBe(3);
    expect(breakdown.totalEffective).toBe(4);
    expect(lifted).toEqual([{ id: 'assist', label: 'Assist', bonus: 1 }]);
  });
});
