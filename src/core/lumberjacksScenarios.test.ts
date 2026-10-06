import { describe, expect, it } from 'vitest';
import { deriveSimulation } from '@/core/activation/simulation';
import { attackArraySize } from '@/core/attacks/attackStructure';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { NO_MODS } from '@/core/testing/fixtures';
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
