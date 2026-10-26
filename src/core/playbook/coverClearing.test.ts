import { describe, expect, it } from "vitest";
import { makeAttacker } from "../testing/fixtures";
import { coverSwingClockIndices, wrapPickClearsCover } from "./coverClearing";

describe("cover clearing", () => {
  it("knows which picks clear cover", () => {
    const attacker = makeAttacker();

    expect(wrapPickClearsCover(attacker, "push")).toBe(true);
    expect(wrapPickClearsCover(attacker, "two")).toBe(false);
    expect(wrapPickClearsCover(attacker, null)).toBe(false);
  });

  it("keeps a fixed base then Berserker clock for cover", () => {
    const berserker = makeAttacker({ inf: 2, berserker: true });

    const lastBerserkerRow = 3;

    expect(coverSwingClockIndices(berserker, 2)).toEqual([
      0,
      2,
      1,
      lastBerserkerRow,
    ]);
  });
});
