import { describe, expect, it } from "vitest";
import { probAttackSucceeds } from "../damage/probability";
import { makeAttacker } from "../testing/fixtures";
import {
  defaultWrapPicks,
  rowHasWrapContinuation,
  rowHasWrapPick,
  wrapExtendedNetNeeded,
  wrapNetThresholdAllHits,
  wrapSlotBudget,
  wrapSlotColumns,
  wrapSlotCount,
} from "./wrapSlots";

/** The fixture playbook's widest column. */
const CARD_WIDTH = 4;

/** Two full card widths and one net past them. */
const TWO_WIDTHS_AND_ONE = 2 * CARD_WIDTH + 1;

describe("default plan rows", () => {
  it("builds one empty slot per row by default", () => {
    expect(defaultWrapPicks(2)).toEqual([[null], [null]]);
  });
});

describe("wrap slots", () => {
  const attacker = makeAttacker();

  it("needs one slot per card width of net successes", () => {
    expect(wrapSlotCount(attacker, 0)).toBe(1);
    expect(wrapSlotCount(attacker, CARD_WIDTH)).toBe(1);
    expect(wrapSlotCount(attacker, CARD_WIDTH + 1)).toBe(2);
    expect(wrapSlotCount(attacker, TWO_WIDTHS_AND_ONE)).toBe(2 + 1);
  });

  it("budgets each slot from what is left after full steps", () => {
    expect(wrapSlotBudget(attacker, TWO_WIDTHS_AND_ONE, 0)).toBe(CARD_WIDTH);
    expect(wrapSlotBudget(attacker, TWO_WIDTHS_AND_ONE, 1)).toBe(CARD_WIDTH);
    expect(wrapSlotBudget(attacker, TWO_WIDTHS_AND_ONE, 2)).toBe(1);
    expect(wrapSlotBudget(attacker, CARD_WIDTH, 1)).toBe(0);
  });

  it("extends net needed past the card width on later slots", () => {
    expect(wrapExtendedNetNeeded(attacker, 1, 2)).toBe(CARD_WIDTH + 2);
    expect(wrapNetThresholdAllHits(attacker, ["four", "one"])).toBe(
      CARD_WIDTH + 1,
    );
    expect(wrapNetThresholdAllHits(attacker, ["two", null])).toBe(2);
    expect(wrapNetThresholdAllHits(attacker, [])).toBe(0);
  });
});

describe("rowHasWrapPick", () => {
  it("is true when any slot of the row holds a pick", () => {
    expect(rowHasWrapPick([null, "two"])).toBe(true);
  });

  it("is false when every slot is empty", () => {
    expect(rowHasWrapPick([null, null])).toBe(false);
  });

  it("is false for a missing row", () => {
    expect(rowHasWrapPick(undefined)).toBe(false);
  });
});

describe("rowHasWrapContinuation", () => {
  it("is true when the row has slots past the primary pick", () => {
    expect(rowHasWrapContinuation(["two", null])).toBe(true);
  });

  it("is false when the row only has the primary pick", () => {
    expect(rowHasWrapContinuation(["two"])).toBe(false);
  });
});

describe("wrapSlotColumns", () => {
  const attacker = makeAttacker();
  const roll = { tac: 6, pHit: 0.5, armor: 1, netHitBonus: 0 };

  it("keeps only the columns within the slot budget", () => {
    const nets = (maxNet: number, pickIndex: number) =>
      wrapSlotColumns(attacker, roll, maxNet, pickIndex).map(
        ({ column }) => column.netSuccesses,
      );

    expect(nets(2, 0)).toEqual([1, 2]);
    expect(nets(TWO_WIDTHS_AND_ONE, 2)).toEqual([1]);
  });

  it("makes the columns the gained net hits cover certain", () => {
    const instructed = { ...roll, netHitBonus: 2 };
    const chances = wrapSlotColumns(attacker, instructed, CARD_WIDTH, 0).map(
      ({ hitChance }) => hitChance,
    );

    expect(chances.slice(0, 2)).toEqual([1, 1]);
    expect(chances[2]).toBeLessThan(1);
  });

  it("prices each column at the net the slot actually needs", () => {
    const [first] = wrapSlotColumns(attacker, roll, TWO_WIDTHS_AND_ONE, 1);
    const netNeeded = wrapExtendedNetNeeded(attacker, 1, 1);

    expect(first.hitChance).toBe(
      probAttackSucceeds(
        roll.tac,
        roll.pHit,
        roll.armor,
        netNeeded,
        roll.netHitBonus,
      ),
    );
  });
});
