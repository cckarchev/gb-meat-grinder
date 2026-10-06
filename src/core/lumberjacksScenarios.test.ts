import { describe, expect, it } from 'vitest';
import { deriveSimulation } from '@/core/activation/simulation';
import { attackArraySize } from '@/core/attacks/attackStructure';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { NO_MODS } from '@/core/testing/fixtures';
import { bucker } from '@/data/attackers/bucker';
import { crossCut } from '@/data/attackers/crossCut';

const TARGET_HP = 18;
const NO_CHARACTER_PLAY = null;

/** Cross Cut's two base attacks: a `6`, then the double GB into The Bigger They Are... */
const sixThenBiggerTheyAre = () => {
  const rows = attackArraySize(crossCut);

  const wrapPicks = Array.from({ length: rows }, (): string[] => []);
  const characterPlayPicks = Array.from(
    { length: rows },
    (): (string | null)[] => [],
  );

  wrapPicks[0] = ['dmg6'];
  characterPlayPicks[0] = [NO_CHARACTER_PLAY];
  wrapPicks[1] = ['cup'];
  characterPlayPicks[1] = ['theBiggerTheyAre'];

  return { wrapPicks, characterPlayPicks };
};

describe('Cross Cut: The Bigger They Are...', () => {
  const attackPlan = sixThenBiggerTheyAre();

  const derive = (toughHide: boolean) => {
    return deriveSimulation(crossCut, {
      enemyDef: 4,
      armor: 1,
      hp: TARGET_HP,
      influence: 2,
      charging: false,
      chargeAttackIndex: NO_ATTACK_INDEX,
      enemyHasCover: false,
      enemyDefensiveStance: false,
      enemyKnockedDown: false,
      enemySnared: false,
      enemyResilience: false,
      gangingUp: 0,
      crowdingOut: 0,
      bonusTimeByAttack: attackPlan.wrapPicks.map(() => false),
      damageMods: { ...NO_MODS, toughHide },
      activeTraits: {},
      attackPlan,
    });
  };

  it('halves the HP the first swing leaves', () => {
    const derived = derive(false);

    // 18 - 6 = 12 HP left, half is 6.
    expect(derived.rowDamageIfHit.slice(0, 2)).toEqual([6, 6]);
  });

  it('is condition damage that Tough Hide does not reduce', () => {
    const derived = derive(true);

    // The 6 drops to 5 (13 HP left), and half of 13 rounds down to 6.
    expect(derived.rowDamageIfHit.slice(0, 2)).toEqual([5, 6]);
  });
});

describe('Bucker: Anatomical Precision', () => {
  const twoSwingsOfTwo = () => {
    const rows = attackArraySize(bucker);

    const wrapPicks = Array.from({ length: rows }, (): string[] => []);
    const characterPlayPicks = Array.from(
      { length: rows },
      (): (string | null)[] => [],
    );

    wrapPicks[0] = ['m2'];
    characterPlayPicks[0] = [NO_CHARACTER_PLAY];
    wrapPicks[1] = ['m2'];
    characterPlayPicks[1] = [NO_CHARACTER_PLAY];

    return { wrapPicks, characterPlayPicks };
  };

  const deriveAgainst = (armor: number) => {
    const attackPlan = twoSwingsOfTwo();

    return deriveSimulation(bucker, {
      enemyDef: 4,
      armor,
      hp: TARGET_HP,
      influence: 2,
      charging: false,
      chargeAttackIndex: NO_ATTACK_INDEX,
      enemyHasCover: false,
      enemyDefensiveStance: false,
      enemyKnockedDown: false,
      enemySnared: false,
      enemyResilience: false,
      gangingUp: 0,
      crowdingOut: 0,
      bonusTimeByAttack: attackPlan.wrapPicks.map(() => false),
      damageMods: NO_MODS,
      activeTraits: {},
      attackPlan,
    });
  };

  it('lowers the target ARM by 1 on every swing', () => {
    const derived = deriveAgainst(2);

    expect(derived.attacks.map((attack) => attack.armor)).toEqual([1, 1]);
  });

  it('cannot take ARM below 0', () => {
    const derived = deriveAgainst(0);

    expect(derived.attacks.map((attack) => attack.armor)).toEqual([0, 0]);
  });
});

describe('Bucker: Axe A Question', () => {
  const assistThenTwo = () => {
    const rows = attackArraySize(bucker);

    const wrapPicks = Array.from({ length: rows }, (): string[] => []);
    const characterPlayPicks = Array.from(
      { length: rows },
      (): (string | null)[] => [],
    );

    wrapPicks[0] = ['gb'];
    characterPlayPicks[0] = ['axeAQuestion'];
    wrapPicks[1] = ['m2'];
    characterPlayPicks[1] = [NO_CHARACTER_PLAY];

    return { wrapPicks, characterPlayPicks };
  };

  const derive = (assistEngaged: boolean) => {
    const attackPlan = assistThenTwo();

    return deriveSimulation(bucker, {
      enemyDef: 4,
      armor: 1,
      hp: TARGET_HP,
      influence: 2,
      charging: false,
      chargeAttackIndex: NO_ATTACK_INDEX,
      enemyHasCover: false,
      enemyDefensiveStance: false,
      enemyKnockedDown: false,
      enemySnared: false,
      enemyResilience: false,
      gangingUp: 0,
      crowdingOut: 0,
      bonusTimeByAttack: attackPlan.wrapPicks.map(() => false),
      damageMods: { ...NO_MODS, assistEngaged },
      activeTraits: {},
      attackPlan,
    });
  };

  it('gives the next attack +1 TAC and +1 DMG while Mallet or Oak engages', () => {
    const derived = derive(true);

    expect(derived.attacks.map((attack) => attack.tac)).toEqual([5, 6]);
    expect(derived.rowDamageIfHit.slice(0, 2)).toEqual([0, 3]);
  });

  it('gives nothing when neither engages the target', () => {
    const derived = derive(false);

    expect(derived.attacks.map((attack) => attack.tac)).toEqual([5, 5]);
    expect(derived.rowDamageIfHit.slice(0, 2)).toEqual([0, 2]);
  });
});
