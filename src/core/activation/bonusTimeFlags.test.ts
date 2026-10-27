import { describe, expect, it } from "vitest";
import { BONUS_TIME_MOMENTUM_COST } from "../shared/constants";
import { makeAttacker, NO_MODS } from "../testing/fixtures";
import { canAffordBonusTime, sanitizeBonusTimeFlags } from "./bonusTimeFlags";

describe("canAffordBonusTime", () => {
  it("needs a pool that covers the cost", () => {
    expect(canAffordBonusTime(BONUS_TIME_MOMENTUM_COST)).toBe(true);
    expect(canAffordBonusTime(BONUS_TIME_MOMENTUM_COST - 1)).toBe(false);
  });
});

describe("sanitizeBonusTimeFlags", () => {
  const attacker = makeAttacker({ inf: 3 });
  const activeBaseCount = 3;

  it("clears Bonus Time flags that cannot be paid", () => {
    expect(
      sanitizeBonusTimeFlags({
        attacker,
        wrapPicks: [["dodge"], ["one"], ["dodge"]],
        damageMods: NO_MODS,
        startingMomentum: 0,
        bonusTimeByAttack: [true, true, true],
        activeBaseCount,
      }),
    ).toEqual([false, false, true]);
  });
});
