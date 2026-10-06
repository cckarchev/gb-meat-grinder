import { describe, expect, it } from 'vitest';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import {
  damageModifierBreakdown,
  rowDamageIfAllHit,
} from '@/core/damage/rowDamage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type { PlaybookDamageMods } from '@/core/playbook/playbook.types';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import {
  CONDITION_GUILD,
  makeAttacker,
  makeRollParams,
  modsWith,
  NEUTRAL_TARGET_HP,
  NO_MODS,
  PLAY_DAMAGE,
  threeOf,
} from '@/core/testing/fixtures';
import type { AttackerData } from '@/data/attackers/attacker.types';
import { burningPassion, searingStrike } from '@/data/characterTraits';

const SWINGS = 3;

const timelineFor = (
  attacker: AttackerData,
  plan: AttackPlan,
  damageMods: PlaybookDamageMods = NO_MODS,
) => {
  const params = makeRollParams({
    attacker,
    damageMods,
    activeBaseCount: SWINGS,
  });

  return activationTimeline(plan, params);
};

const armorReductions = (
  attacker: AttackerData,
  plan: AttackPlan,
  damageMods?: PlaybookDamageMods,
): number[] => {
  return timelineFor(attacker, plan, damageMods).map(
    (state) => state.effectsBefore.armorReduction,
  );
};

describe('Searing Strike', () => {
  const searing = makeAttacker({
    inf: SWINGS,
    guild: CONDITION_GUILD,
    characterTraits: [searingStrike],
  });

  it('gives -1 ARM after the first swing that causes damage', () => {
    expect(armorReductions(searing, threeOf('one'))).toEqual([0, 1, 1]);
  });

  it('does not trigger on a swing whose damage Tough Hide zeroes', () => {
    const plan: AttackPlan = {
      wrapPicks: [['one'], ['two'], ['two']],
      characterPlayPicks: [[null], [null], [null]],
    };

    expect(
      armorReductions(searing, plan, modsWith({ toughHide: true })),
    ).toEqual([0, 0, 1]);
  });

  it('is one source with the pre-applied Searing Strike debuff', () => {
    expect(
      armorReductions(
        searing,
        threeOf('one'),
        modsWith({ buffs: { searingStrike: true } }),
      ),
    ).toEqual([1, 1, 1]);
  });

  it('is granted by a buff, which also adds TAC from the first swing', () => {
    const plain = makeAttacker({ inf: SWINGS, guild: CONDITION_GUILD });
    const steel = modsWith({ buffs: { steel: true } });

    const timeline = timelineFor(plain, threeOf('one'), steel);

    expect(timeline.map((state) => state.effectsBefore.tacBonus)).toEqual([
      1, 1, 1,
    ]);
    expect(armorReductions(plain, threeOf('one'), steel)).toEqual([0, 1, 1]);
  });
});

describe('Burning Passion', () => {
  const passionate = makeAttacker({
    inf: SWINGS,
    guild: CONDITION_GUILD,
    characterTraits: [burningPassion],
  });

  const damageFor = (attacker: AttackerData, mods: PlaybookDamageMods) => {
    const plan = threeOf('two');
    const timeline = timelineFor(attacker, plan, mods);

    return rowDamageIfAllHit(attacker, plan.wrapPicks, mods, SWINGS, timeline);
  };

  it('is inert while the target is not Burning', () => {
    expect(damageFor(passionate, NO_MODS)).toEqual([2, 2, 2]);
  });

  it('adds +1 to every swing when the target starts Burning', () => {
    expect(damageFor(passionate, modsWith({ targetBurning: true }))).toEqual([
      3, 3, 3,
    ]);
  });

  it('starts on the swing after Searing Strike lights the target', () => {
    expect(damageFor(passionate, modsWith({ buffs: { steel: true } }))).toEqual(
      [2, 3, 3],
    );
  });

  it('stacks with a damage buff', () => {
    expect(
      damageFor(
        passionate,
        modsWith({ targetBurning: true, buffs: { sharp: true } }),
      ),
    ).toEqual([4, 4, 4]);
  });

  it('never lifts play damage', () => {
    const withPlay = makeAttacker({
      inf: SWINGS,
      guild: CONDITION_GUILD,
      characterTraits: [burningPassion],
      characterPlays: [PLAY_DAMAGE],
    });

    const plan: AttackPlan = {
      wrapPicks: [['gb']],
      characterPlayPicks: [['playDamage']],
    };

    const mods = modsWith({ targetBurning: true });

    const timeline = activationTimeline(plan, {
      attacker: withPlay,
      damageMods: mods,
      activeBaseCount: 1,
      chargeAttackIndex: NO_ATTACK_INDEX,
      targetHp: NEUTRAL_TARGET_HP,
      enemyKnockedDown: false,
    });

    // `gb` card 1 + 1 Burning Passion, play 3 untouched.
    expect(
      rowDamageIfAllHit(withPlay, plan.wrapPicks, mods, 1, timeline),
    ).toEqual([5]);
  });
});

describe('buffs of another guild', () => {
  it('have no effect when left toggled after switching attacker', () => {
    const otherGuild = makeAttacker({
      inf: SWINGS,
      characterTraits: [burningPassion],
    });
    const staleMods = modsWith({ buffs: { steel: true } });

    const timeline = timelineFor(otherGuild, threeOf('two'), staleMods);

    expect(timeline.map((state) => state.effectsBefore.tacBonus)).toEqual([
      0, 0, 0,
    ]);
    expect(timeline.map((state) => state.targetBurningBefore)).toEqual([
      false,
      false,
      false,
    ]);
  });
});

describe('the Burning condition', () => {
  it('lights the target whatever the attacker guild', () => {
    const otherGuild = makeAttacker({
      inf: SWINGS,
      characterTraits: [burningPassion],
    });
    const mods = modsWith({ targetBurning: true });

    const timeline = timelineFor(otherGuild, threeOf('two'), mods);

    expect(timeline.map((state) => state.targetBurningBefore)).toEqual([
      true,
      true,
      true,
    ]);
  });
});

describe('Burning Passion in the breakdown', () => {
  const passionate = makeAttacker({
    inf: SWINGS,
    guild: CONDITION_GUILD,
    characterTraits: [burningPassion],
  });

  const breakdownFor = (mods: PlaybookDamageMods) => {
    const plan = threeOf('two');
    const timeline = timelineFor(passionate, plan, mods);

    return damageModifierBreakdown(
      passionate,
      plan.wrapPicks,
      mods,
      SWINGS,
      timeline,
    );
  };

  it('itemizes its lift as its own line', () => {
    const breakdown = breakdownFor(modsWith({ targetBurning: true }));

    expect(breakdown.totalEffective).toBe(9);
    expect(breakdown.buffBonuses.at(-1)).toEqual({
      id: 'burningPassion',
      label: 'Burning Passion',
      bonus: 3,
    });
  });

  it('is left out while it adds nothing', () => {
    const ids = breakdownFor(NO_MODS).buffBonuses.map((buff) => buff.id);

    expect(ids).not.toContain('burningPassion');
  });
});
