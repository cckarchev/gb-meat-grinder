import { describe, expect, it } from "vitest";
import {
  effectiveDefMinRoll,
  enemyDefForSwing,
  tacBonusFromDefReductionCap,
} from "./swingDefense";

const STANCE = true;
const DEF = 4;
const DEF_CAP = 6;
const MIN_ROLL_FLOOR = 2;

describe("enemyDefForSwing", () => {
  it("adds +1 DEF from Defensive Stance on the charge only, capped at 6", () => {
    expect(enemyDefForSwing(DEF, 0, 0, STANCE, 2)).toBe(DEF + 1);
    expect(enemyDefForSwing(DEF_CAP, 0, 0, STANCE, 2)).toBe(DEF_CAP);
    expect(enemyDefForSwing(DEF, 1, 0, STANCE, 2)).toBe(DEF);
    expect(enemyDefForSwing(DEF, 0, 0, !STANCE, 2)).toBe(DEF);
  });
});

describe("DEF floor", () => {
  it("clamps the to-hit roll to 2+..6+", () => {
    const lowDef = 3;
    const bigReduction = 5;
    const defOverCap = 7;

    expect(effectiveDefMinRoll(DEF, 1)).toBe(DEF - 1);
    expect(effectiveDefMinRoll(lowDef, bigReduction)).toBe(MIN_ROLL_FLOOR);
    expect(effectiveDefMinRoll(defOverCap, 0)).toBe(DEF_CAP);
  });

  it("turns DEF reduction past 2+ into bonus dice", () => {
    expect(tacBonusFromDefReductionCap(2, 1)).toBe(1);
    expect(tacBonusFromDefReductionCap(0, 0)).toBe(2);
    expect(tacBonusFromDefReductionCap(DEF, 1)).toBe(0);
  });
});
