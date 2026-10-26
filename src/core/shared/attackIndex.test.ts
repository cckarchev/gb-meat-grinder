import { describe, expect, it } from "vitest";
import { isAttackIndex } from "./attackIndex";
import { NO_ATTACK_INDEX } from "./constants";

describe("isAttackIndex", () => {
  it("accepts the first row and later rows", () => {
    expect(isAttackIndex(0)).toBe(true);
    const laterRow = 3;

    expect(isAttackIndex(laterRow)).toBe(true);
  });

  it("rejects the no-attack sentinel", () => {
    expect(isAttackIndex(NO_ATTACK_INDEX)).toBe(false);
  });
});
