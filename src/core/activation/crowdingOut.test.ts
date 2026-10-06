import { describe, expect, it } from 'vitest';
import { crowdingOutRange } from '@/core/activation/crowdingOut';
import {
  makeAttacker,
  modsWith,
  NO_MODS,
  TEAMMATE_GUILD,
} from '@/core/testing/fixtures';
import { CROWDING_OUT_RANGE } from '@/data/attackers/statRanges';

describe('crowdingOutRange', () => {
  const attacker = makeAttacker({ guild: TEAMMATE_GUILD });

  it('is the attacker range with no buff', () => {
    expect(crowdingOutRange(attacker, NO_MODS)).toEqual(CROWDING_OUT_RANGE);
  });

  it('is pinned at 0 while a buff ignores the crowding out penalty', () => {
    const spread = modsWith({ buffs: { spread: true } });

    expect(crowdingOutRange(attacker, spread)).toEqual({ min: 0, max: 0 });
  });
});
