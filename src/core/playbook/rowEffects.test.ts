import { describe, expect, it } from 'vitest';
import { pickEffectsForLaterSwings } from '@/core/playbook/rowEffects';
import { makeAttacker, orderFor } from '@/core/testing/fixtures';

const NO_EFFECTS = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReductionForLater: 0,
  damageBonusForLater: 0,
};

const FIRST_SWING = { attackIndex: 0, pickIndex: 0 };
const SECOND_SWING = { attackIndex: 1, pickIndex: 0 };

describe('plain playbook lines', () => {
  it('treat omitted later-swing bonuses as none', () => {
    const attacker = makeAttacker({
      playbook: [
        {
          netSuccesses: 1,
          results: [{ id: 'bare', label: '1', damage: 1 }],
        },
      ],
    });

    expect(
      pickEffectsForLaterSwings(
        orderFor(attacker, 1),
        { wrapPicks: [['bare']], characterPlayPicks: [[null]] },
        FIRST_SWING,
        false,
      ),
    ).toEqual(NO_EFFECTS);
  });
});

describe('Knock Down', () => {
  const order = orderFor(makeAttacker(), 2);
  const plan = {
    wrapPicks: [['kd'], ['kd']],
    characterPlayPicks: [[null], [null]],
  };

  it('gives later swings -1 DEF only from the first KD', () => {
    expect(pickEffectsForLaterSwings(order, plan, FIRST_SWING, false)).toEqual({
      ...NO_EFFECTS,
      defReductionForLater: 1,
    });

    expect(pickEffectsForLaterSwings(order, plan, SECOND_SWING, false)).toEqual(
      NO_EFFECTS,
    );
  });

  it('gives nothing when the target starts Knocked Down', () => {
    const enemyKnockedDown = true;

    expect(
      pickEffectsForLaterSwings(order, plan, FIRST_SWING, enemyKnockedDown),
    ).toEqual(NO_EFFECTS);
  });
});

describe('character plays in row effects', () => {
  const order = orderFor(makeAttacker(), 2);
  const gbTwice = [['gb'], ['gb']];

  it('applies a play once and ignores a repeated Once Per Turn pick', () => {
    expect(
      pickEffectsForLaterSwings(
        order,
        { wrapPicks: gbTwice, characterPlayPicks: [['playTac'], ['playTac']] },
        SECOND_SWING,
        false,
      ),
    ).toEqual(NO_EFFECTS);

    expect(
      pickEffectsForLaterSwings(
        order,
        { wrapPicks: gbTwice, characterPlayPicks: [['playTac'], ['playDef']] },
        SECOND_SWING,
        false,
      ),
    ).toEqual({ ...NO_EFFECTS, defReductionForLater: 1 });
  });

  it('falls back to the default play on an empty slot', () => {
    expect(
      pickEffectsForLaterSwings(
        order,
        { wrapPicks: gbTwice, characterPlayPicks: [[null], [null]] },
        FIRST_SWING,
        false,
      ),
    ).toEqual({ ...NO_EFFECTS, tacBonusForLater: 2 });
  });
});
