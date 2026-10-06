import { describe, expect, it } from 'vitest';
import {
  activationTimeline,
  swingDamageMods,
  swingStateAt,
} from '@/core/attacks/activationTimeline';
import type { TimelineParams } from '@/core/attacks/activationTimeline.types';
import { playDamageForHealth } from '@/core/attacks/swingPlayDamage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type { CharacterPlay } from '@/core/playbook/playbook.types';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import {
  makeAttacker,
  modsWith,
  NEUTRAL_TARGET_HP,
  NO_MODS,
  PLAY_ARM,
  PLAY_ASSIST,
  PLAY_DAMAGE,
  PLAY_DEF,
  PLAY_HALF_HEALTH,
  PLAY_REPEATABLE,
  PLAY_TAC,
  TEAMMATE_GUILD,
  TRAIT_ARM,
} from '@/core/testing/fixtures';

const params = (overrides: Partial<TimelineParams> = {}): TimelineParams => {
  return {
    attacker: makeAttacker({
      inf: 3,
      characterPlays: [PLAY_TAC, PLAY_DEF, PLAY_ARM],
    }),
    damageMods: NO_MODS,
    activeBaseCount: 3,
    chargeAttackIndex: NO_ATTACK_INDEX,
    targetHp: NEUTRAL_TARGET_HP,
    enemyKnockedDown: false,
    ...overrides,
  };
};

const NONE = {
  tacBonus: 0,
  defReduction: 0,
  armorReduction: 0,
  damageBonus: 0,
};

describe('activationTimeline carried effects', () => {
  it('starts every swing with nothing when no pick carries an effect', () => {
    const plan: AttackPlan = {
      wrapPicks: [['one'], ['two'], ['four']],
      characterPlayPicks: [[null], [null], [null]],
    };

    const timeline = activationTimeline(plan, params());

    expect(timeline.map((state) => state.effectsBefore)).toEqual([
      NONE,
      NONE,
      NONE,
    ]);
  });

  it('carries a play and a KD into later swings only', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['kd'], ['one']],
      characterPlayPicks: [['playTac'], [null], [null]],
    };

    const timeline = activationTimeline(plan, params());

    expect(timeline[0].effectsBefore).toEqual(NONE);
    expect(timeline[1].effectsBefore).toEqual({ ...NONE, tacBonus: 2 });
    expect(timeline[2].effectsBefore).toEqual({
      ...NONE,
      tacBonus: 2,
      defReduction: 1,
    });
  });

  it('carries an ARM play into later swings', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['one'], ['one']],
      characterPlayPicks: [['playArm'], [null], [null]],
    };

    const timeline = activationTimeline(plan, params());

    expect(timeline[1].effectsBefore.armorReduction).toBe(1);
    expect(timeline[2].effectsBefore.armorReduction).toBe(1);
  });

  it('applies an ARM play picked twice only once', () => {
    const anyTurnArm: CharacterPlay = { ...PLAY_ARM, oncePerTurn: false };
    const attacker = makeAttacker({ inf: 3, characterPlays: [anyTurnArm] });

    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['gb'], ['one']],
      characterPlayPicks: [['playArm'], ['playArm'], [null]],
    };

    const timeline = activationTimeline(plan, params({ attacker }));

    expect(timeline[0].effectsBefore.armorReduction).toBe(0);
    expect(timeline[2].effectsBefore.armorReduction).toBe(1);
  });

  it('gives rows outside the activation no carry-over', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['one'], ['one']],
      characterPlayPicks: [['playTac'], [null], [null]],
    };

    const timeline = activationTimeline(plan, params({ activeBaseCount: 1 }));

    expect(timeline[1].effectsBefore).toEqual(NONE);
    expect(timeline[2].effectsBefore).toEqual(NONE);
  });

  it('gives rows past the plan no carry-over', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb']],
      characterPlayPicks: [['playTac']],
    };

    const timeline = activationTimeline(plan, params({ activeBaseCount: 1 }));

    expect(swingStateAt(timeline, 5).effectsBefore).toEqual(NONE);
  });
});

describe('named effects do not stack', () => {
  it('applies a pre-applied guild ARM debuff from the first swing', () => {
    const plan: AttackPlan = {
      wrapPicks: [['one'], ['one']],
      characterPlayPicks: [[null], [null]],
    };

    const timeline = activationTimeline(
      plan,
      params({
        activeBaseCount: 2,
        damageMods: modsWith({ buffs: { sunder: true } }),
      }),
    );

    expect(timeline[0].effectsBefore.armorReduction).toBe(1);
    expect(timeline[1].effectsBefore.armorReduction).toBe(1);
  });

  it('stacks effects with different names', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['one']],
      characterPlayPicks: [['playArm'], [null]],
    };

    const timeline = activationTimeline(
      plan,
      params({
        activeBaseCount: 2,
        damageMods: modsWith({ buffs: { sunder: true } }),
      }),
    );

    expect(timeline[1].effectsBefore.armorReduction).toBe(2);
  });

  it('applies a pre-applied guild DEF debuff from the first swing', () => {
    const attacker = makeAttacker({ guild: TEAMMATE_GUILD });
    const plan: AttackPlan = {
      wrapPicks: [['one'], ['one']],
      characterPlayPicks: [[null], [null]],
    };

    const timeline = activationTimeline(
      plan,
      params({
        attacker,
        activeBaseCount: 2,
        damageMods: modsWith({ buffs: { trip: true } }),
      }),
    );

    expect(timeline.map((state) => state.effectsBefore.defReduction)).toEqual([
      1, 1,
    ]);
  });

  it('applies a passive ARM trait to every swing and stacks it with a play', () => {
    const attacker = makeAttacker({
      inf: 3,
      characterPlays: [PLAY_ARM],
      characterTraits: [TRAIT_ARM],
    });

    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['one']],
      characterPlayPicks: [['playArm'], [null]],
    };

    const timeline = activationTimeline(
      plan,
      params({ attacker, activeBaseCount: 2 }),
    );

    expect(timeline.map((state) => state.effectsBefore.armorReduction)).toEqual(
      [1, 2],
    );
  });

  it('applies a play that is not Once Per Turn only once', () => {
    const attacker = makeAttacker({
      inf: 3,
      characterPlays: [PLAY_REPEATABLE],
    });

    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['gb'], ['one']],
      characterPlayPicks: [['playRepeatable'], ['playRepeatable'], [null]],
    };

    const timeline = activationTimeline(plan, params({ attacker }));

    expect(timeline[2].effectsBefore.tacBonus).toBe(1);
  });
});

describe('Assist', () => {
  const attacker = makeAttacker({ inf: 3, characterPlays: [PLAY_ASSIST] });

  const plan: AttackPlan = {
    wrapPicks: [['gb'], ['two'], ['two']],
    characterPlayPicks: [['playAssist'], [null], [null]],
  };

  it('gives later swings +1 TAC and +1 DMG while a named model engages', () => {
    const timeline = activationTimeline(
      plan,
      params({ attacker, damageMods: modsWith({ assistEngaged: true }) }),
    );

    expect(timeline.map((state) => state.effectsBefore.tacBonus)).toEqual([
      0, 1, 1,
    ]);
    expect(timeline.map((state) => state.playbookDamageBonus)).toEqual([
      0, 1, 1,
    ]);
  });

  it('gives nothing when no named model engages', () => {
    const timeline = activationTimeline(plan, params({ attacker }));

    expect(timeline.map((state) => state.effectsBefore)).toEqual([
      NONE,
      NONE,
      NONE,
    ]);
    expect(timeline.map((state) => state.playbookDamageBonus)).toEqual([
      0, 0, 0,
    ]);
  });
});

describe('damaging character plays', () => {
  const attacker = makeAttacker({ characterPlays: [PLAY_DAMAGE] });

  const twoGbs: AttackPlan = {
    wrapPicks: [['gb'], ['gb']],
    characterPlayPicks: [['playDamage'], ['playDamage']],
  };

  it('puts the play damage on the slot that triggers it', () => {
    const timeline = activationTimeline(twoGbs, params({ attacker }));

    expect(timeline[0].playDamageBySlot).toEqual([3]);
  });

  it('deals an Once Per Turn play only the first time', () => {
    const timeline = activationTimeline(twoGbs, params({ attacker }));

    expect(timeline[1].playDamageBySlot).toEqual([0]);
  });

  it('applies Tough Hide and damage buffs to it', () => {
    const toughHide = activationTimeline(
      twoGbs,
      params({ attacker, damageMods: modsWith({ toughHide: true }) }),
    );

    const sharp = activationTimeline(
      twoGbs,
      params({ attacker, damageMods: modsWith({ buffs: { sharp: true } }) }),
    );

    expect(toughHide[0].playDamageBySlot).toEqual([2]);
    expect(sharp[0].playDamageBySlot).toEqual([4]);
  });

  it('skips a bonus limited to playbook damage results', () => {
    const butcher = makeAttacker({
      guild: TEAMMATE_GUILD,
      characterPlays: [PLAY_DAMAGE],
    });

    const carve = activationTimeline(
      twoGbs,
      params({
        attacker: butcher,
        damageMods: modsWith({ buffs: { carve: true } }),
      }),
    );

    expect(carve[0].playDamageBySlot).toEqual([3]);
  });
});

describe('character plays that deal damage from the target current HP', () => {
  const attacker = makeAttacker({ characterPlays: [PLAY_HALF_HEALTH] });

  const fourThenHalf: AttackPlan = {
    wrapPicks: [['four'], ['gb']],
    characterPlayPicks: [[null], ['playHalfHealth']],
  };

  it('deals half the HP left after the earlier swings, rounded down', () => {
    const targetHp = 15;
    const timeline = activationTimeline(
      fourThenHalf,
      params({ attacker, targetHp }),
    );

    // 15 - 4 = 11 HP left, half rounded down is 5.
    expect(timeline[1].playDamageBySlot).toEqual([5]);
  });

  it('uses the HP before its own swing, not after the card damage', () => {
    const targetHp = 10;
    const halfFirst: AttackPlan = {
      wrapPicks: [['gb']],
      characterPlayPicks: [['playHalfHealth']],
    };

    const timeline = activationTimeline(
      halfFirst,
      params({ attacker, targetHp, activeBaseCount: 1 }),
    );

    expect(timeline[0].playDamageBySlot).toEqual([5]);
  });

  it('is unmodified by Tough Hide and damage buffs', () => {
    const targetHp = 15;

    const toughHide = activationTimeline(
      fourThenHalf,
      params({ attacker, targetHp, damageMods: modsWith({ toughHide: true }) }),
    );

    const sharp = activationTimeline(
      fourThenHalf,
      params({
        attacker,
        targetHp,
        damageMods: modsWith({ buffs: { sharp: true } }),
      }),
    );

    // The 4 becomes 3 under Tough Hide (12 left) and 5 with Sharp (10 left).
    expect(toughHide[1].playDamageBySlot).toEqual([6]);
    expect(sharp[1].playDamageBySlot).toEqual([5]);
  });

  it('deals nothing once the earlier swings have taken out the target', () => {
    const targetHp = 3;
    const timeline = activationTimeline(
      fourThenHalf,
      params({ attacker, targetHp }),
    );

    expect(timeline[1].playDamageBySlot).toEqual([0]);
  });

  it('records the divisor on the slot so the odds can recompute it', () => {
    const timeline = activationTimeline(fourThenHalf, params({ attacker }));

    expect(timeline[0].healthPlayDivisorBySlot).toEqual([0]);
    expect(timeline[1].healthPlayDivisorBySlot).toEqual([2]);
  });

  it('recomputes the play damage for any HP left', () => {
    const timeline = activationTimeline(fourThenHalf, params({ attacker }));
    const hpLeft = 9;

    expect(playDamageForHealth(timeline[1], hpLeft)).toEqual([4]);
  });
});

describe('swingDamageMods', () => {
  const attacker = makeAttacker({ inf: 3, characterPlays: [PLAY_ASSIST] });
  const mods = modsWith({ assistEngaged: true });

  const timeline = activationTimeline(
    {
      wrapPicks: [['gb'], ['two'], ['two']],
      characterPlayPicks: [['playAssist'], [null], [null]],
    },
    params({ attacker, damageMods: mods }),
  );

  it('keeps the activation mods on a swing without a bonus', () => {
    expect(swingDamageMods(mods, timeline, 0)).toBe(mods);
  });

  it('adds the swing playbook damage bonus, so the pips show it', () => {
    expect(swingDamageMods(mods, timeline, 1)).toEqual({
      ...mods,
      swingDamageBonus: 1,
    });
  });
});

describe('net hits gained on the next attack (Instruction)', () => {
  const attacker = makeAttacker({ guild: TEAMMATE_GUILD });
  const plan: AttackPlan = {
    wrapPicks: [['one'], ['one'], ['one']],
    characterPlayPicks: [[null], [null], [null]],
  };

  it('lands on the first swing of the activation only', () => {
    const timeline = activationTimeline(
      plan,
      params({ attacker, damageMods: modsWith({ buffs: { coach: true } }) }),
    );

    expect(timeline.map((state) => state.netHitBonus)).toEqual([2, 0, 0]);
  });

  it('gives nothing while the buff is off', () => {
    const timeline = activationTimeline(plan, params({ attacker }));

    expect(timeline.map((state) => state.netHitBonus)).toEqual([0, 0, 0]);
  });
});

describe('activationTimeline effects after each swing', () => {
  it('leaves nothing after swings that carry no effect', () => {
    const plan: AttackPlan = {
      wrapPicks: [['one'], ['two']],
      characterPlayPicks: [[null], [null]],
    };

    const timeline = activationTimeline(plan, params({ activeBaseCount: 2 }));

    expect(timeline.map((state) => state.effectsAfter)).toEqual([NONE, NONE]);
  });

  it('includes the effects a swing applies, the last swing too', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['kd']],
      characterPlayPicks: [['playTac'], [null]],
    };

    const timeline = activationTimeline(plan, params({ activeBaseCount: 2 }));

    expect(timeline[0].effectsAfter).toEqual({ ...NONE, tacBonus: 2 });
    expect(timeline[1].effectsAfter).toEqual({
      ...NONE,
      tacBonus: 2,
      defReduction: 1,
    });
  });

  it('includes the ARM an on-damage trait strips on that swing', () => {
    const attacker = makeAttacker({
      inf: 3,
      characterPlays: [PLAY_ARM],
      characterTraits: [TRAIT_ARM],
    });

    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['one']],
      characterPlayPicks: [['playArm'], [null]],
    };

    const timeline = activationTimeline(
      plan,
      params({ attacker, activeBaseCount: 2 }),
    );

    expect(timeline.map((state) => state.effectsAfter.armorReduction)).toEqual([
      2, 2,
    ]);
  });
});
