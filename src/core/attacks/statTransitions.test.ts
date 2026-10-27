import { describe, expect, it } from "vitest";
import { statTransitions } from "./statTransitions";

const STARTING_VALUE = 14;
const FIRST_SWING = 11;
const LATER_SWINGS = 8;

describe("statTransitions", () => {
  it("pairs each swing with the one before it, the first with the starting value", () => {
    expect(
      statTransitions(
        [FIRST_SWING, LATER_SWINGS, LATER_SWINGS],
        STARTING_VALUE,
      ),
    ).toEqual([
      { from: STARTING_VALUE, to: FIRST_SWING },
      { from: FIRST_SWING, to: LATER_SWINGS },
      { from: LATER_SWINGS, to: LATER_SWINGS },
    ]);
  });

  it("returns nothing for an activation without swings", () => {
    expect(statTransitions([], STARTING_VALUE)).toEqual([]);
  });
});
