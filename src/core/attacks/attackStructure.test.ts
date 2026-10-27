import { describe, expect, it } from "vitest";
import { NO_ATTACK_INDEX } from "../shared/constants";
import { makeAttacker } from "../testing/fixtures";
import {
  activeBaseAttackCount,
  attackArraySize,
  berserkerRowOffset,
  chargeInfluenceCost,
  clampChargeAttackIndex,
  effectiveChargeIndex,
  isChargeSwing,
  maxBaseAttackCount,
} from "./attackStructure";

const CHARGING = true;
const NOT_CHARGING = false;
const INFLUENCE = 3;

describe("chargeInfluenceCost", () => {
  it("is 0 when not charging", () => {
    expect(chargeInfluenceCost(makeAttacker(), NOT_CHARGING)).toBe(0);
  });

  it("is 2 for a normal charge and free for Furious models", () => {
    expect(chargeInfluenceCost(makeAttacker(), CHARGING)).toBe(2);

    expect(chargeInfluenceCost(makeAttacker({ furious: true }), CHARGING)).toBe(
      0,
    );
  });
});

describe("activeBaseAttackCount", () => {
  it("buys one attack per influence when not charging", () => {
    expect(activeBaseAttackCount(makeAttacker(), INFLUENCE, NOT_CHARGING)).toBe(
      INFLUENCE,
    );
  });

  it("spends 2 influence on a normal charge", () => {
    expect(activeBaseAttackCount(makeAttacker(), INFLUENCE, CHARGING)).toBe(
      INFLUENCE - 1,
    );
    expect(activeBaseAttackCount(makeAttacker(), 1, CHARGING)).toBe(1);
  });

  it("charges for free when Furious", () => {
    const furious = makeAttacker({ furious: true });

    expect(activeBaseAttackCount(furious, INFLUENCE, CHARGING)).toBe(
      INFLUENCE + 1,
    );
  });

  it("adds a free Feral attack", () => {
    const feral = makeAttacker({ feral: true });

    expect(activeBaseAttackCount(feral, 0, NOT_CHARGING)).toBe(1);
  });
});

describe("array layout", () => {
  it("reserves INF plus the free Furious and Feral attacks", () => {
    const attacker = makeAttacker({ inf: 2, furious: true, feral: true });
    const infPlusFuriousPlusFeral = 2 + 1 + 1;

    expect(maxBaseAttackCount(attacker)).toBe(infPlusFuriousPlusFeral);
    expect(berserkerRowOffset(attacker)).toBe(infPlusFuriousPlusFeral);
    expect(attackArraySize(attacker)).toBe(infPlusFuriousPlusFeral);
  });

  it("doubles the rows for Berserker models", () => {
    const attacker = makeAttacker({ inf: INFLUENCE, berserker: true });

    expect(attackArraySize(attacker)).toBe(2 * INFLUENCE);
  });
});

describe("clampChargeAttackIndex", () => {
  it("keeps an index inside the active base attacks", () => {
    expect(clampChargeAttackIndex(1, INFLUENCE)).toBe(1);
  });

  it("pulls an index past the last base attack back onto it", () => {
    const pastTheEnd = 4;

    expect(clampChargeAttackIndex(pastTheEnd, 2)).toBe(1);
  });

  it("never goes below the first attack, even with no base attacks", () => {
    expect(clampChargeAttackIndex(-1, INFLUENCE)).toBe(0);
    expect(clampChargeAttackIndex(2, 0)).toBe(0);
  });
});

describe("effectiveChargeIndex", () => {
  it("uses the chosen charge row while charging", () => {
    expect(effectiveChargeIndex(CHARGING, 2)).toBe(2);
  });

  it("has no charge row when not charging", () => {
    expect(effectiveChargeIndex(NOT_CHARGING, 2)).toBe(NO_ATTACK_INDEX);
  });
});

describe("isChargeSwing", () => {
  const activeBases = 2;

  it("is true only on the charge row", () => {
    expect(isChargeSwing(1, 1, activeBases)).toBe(true);
    expect(isChargeSwing(0, 1, activeBases)).toBe(false);
  });

  it("is false when not charging", () => {
    expect(isChargeSwing(0, NO_ATTACK_INDEX, activeBases)).toBe(false);
  });

  it("is false when the charge row is no longer an active base", () => {
    expect(isChargeSwing(2, 2, activeBases)).toBe(false);
  });
});
