import { describe, expect, it } from "vitest";
import {
  binomialPmf,
  hitProbabilityPerDie,
  maxNetSuccessesForRoll,
  probAttackSucceeds,
} from "@/core/damage/probability";

const COIN_FLIP = 0.5;
const NO_BONUS = 0;

const THREE_DICE = 3;
const FOUR_DICE = 4;

/** Equally likely outcomes when every die is a coin flip. */
const THREE_DICE_OUTCOMES = 2 ** THREE_DICE;
const FOUR_DICE_OUTCOMES = 2 ** FOUR_DICE;

const DIE_FACES = 6;
const HIGH_STAT = 5;

describe("binomialPmf", () => {
  it("matches C(n,k) p^k (1-p)^(n-k)", () => {
    const waysToPickTwoOfFour = 6;

    expect(binomialPmf(FOUR_DICE, COIN_FLIP, 2)).toBeCloseTo(
      waysToPickTwoOfFour / FOUR_DICE_OUTCOMES,
    );
    expect(binomialPmf(THREE_DICE, COIN_FLIP, 0)).toBeCloseTo(
      1 / THREE_DICE_OUTCOMES,
    );
  });

  it("is 0 outside 0..n", () => {
    expect(binomialPmf(THREE_DICE, COIN_FLIP, THREE_DICE + 1)).toBe(0);
    expect(binomialPmf(THREE_DICE, COIN_FLIP, -1)).toBe(0);
  });
});

describe("hitProbabilityPerDie", () => {
  it("maps a DEF N+ to (7 - N) / 6", () => {
    const fourPlus = 4;

    expect(hitProbabilityPerDie(2)).toBeCloseTo((DIE_FACES - 1) / DIE_FACES);
    expect(hitProbabilityPerDie(fourPlus)).toBeCloseTo(1 / 2);
    expect(hitProbabilityPerDie(DIE_FACES)).toBeCloseTo(1 / DIE_FACES);
  });
});

describe("probAttackSucceeds", () => {
  it("is certain when no net successes are needed", () => {
    expect(probAttackSucceeds(THREE_DICE, COIN_FLIP, 1, 0, NO_BONUS)).toBe(1);
  });

  it("is impossible when the raw hits needed exceed the dice", () => {
    expect(probAttackSucceeds(2, COIN_FLIP, 1, 2, NO_BONUS)).toBe(0);
  });

  it("sums the binomial tail from need + armor hits", () => {
    // 3 dice, ARM 1, need 1 net: P(hits >= 2) = (3 + 1) / 8.
    expect(
      probAttackSucceeds(THREE_DICE, COIN_FLIP, 1, 1, NO_BONUS),
    ).toBeCloseTo((THREE_DICE + 1) / THREE_DICE_OUTCOMES);
  });
});

describe("maxNetSuccessesForRoll", () => {
  it("is TAC minus ARM, floored at 0", () => {
    expect(maxNetSuccessesForRoll(HIGH_STAT, 2, NO_BONUS)).toBe(HIGH_STAT - 2);
    expect(maxNetSuccessesForRoll(2, HIGH_STAT, NO_BONUS)).toBe(0);
  });
});

describe("net hits gained on top of the roll (Instruction)", () => {
  const bonusHits = 2;

  it("makes any need up to the bonus certain, even with no hits", () => {
    expect(
      probAttackSucceeds(THREE_DICE, COIN_FLIP, HIGH_STAT, 2, bonusHits),
    ).toBe(1);
  });

  it("lowers the raw hits needed by the bonus", () => {
    // 3 dice, ARM 1, need 3 net: 1 net from the roll, so P(hits >= 2) = 4 / 8.
    const netNeeded = 3;

    expect(
      probAttackSucceeds(THREE_DICE, COIN_FLIP, 1, netNeeded, bonusHits),
    ).toBeCloseTo((THREE_DICE + 1) / THREE_DICE_OUTCOMES);
  });

  it("adds the bonus after flooring the roll at 0 net", () => {
    expect(maxNetSuccessesForRoll(HIGH_STAT, 2, bonusHits)).toBe(
      HIGH_STAT - 2 + bonusHits,
    );
    expect(maxNetSuccessesForRoll(2, HIGH_STAT, bonusHits)).toBe(bonusHits);
  });
});
