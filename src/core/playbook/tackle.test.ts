import { describe, expect, it } from "vitest";
import { bucker } from "@/data/attackers/bucker";
import { cast } from "@/data/attackers/cast";
import { thresher } from "@/data/attackers/thresher";
import { veteranBoar } from "@/data/attackers/veteranBoar";
import { veteranCinder } from "@/data/attackers/veteranCinder";
import { makeAttacker, orderFor } from "../testing/fixtures";
import { getPlaybookResult } from "./playbookIndex";
import { tackleTakenBeforePick } from "./tackle";

const fixture = makeAttacker();

/** Model with a net-1 `1` line and a net-2 Tackle line. */
const tackleAttacker = makeAttacker({
  playbook: [
    { netSuccesses: 1, results: [getPlaybookResult(fixture, "one")] },
    {
      netSuccesses: 2,
      results: [{ id: "tackle", label: "T", damage: 0, stealsBall: true }],
    },
  ],
});

describe("tackleTakenBeforePick", () => {
  const order = orderFor(tackleAttacker, 2);

  const tackleTakenAt = (
    wrapPicks: string[][],
    attackIndex: number,
    pickIndex: number,
  ): boolean =>
    tackleTakenBeforePick(order, wrapPicks, { attackIndex, pickIndex });

  it("allows only the first Tackle in the activation", () => {
    const wrapPicks = [["tackle"], ["tackle"]];

    expect(tackleTakenAt(wrapPicks, 0, 0)).toBe(false);
    expect(tackleTakenAt(wrapPicks, 1, 0)).toBe(true);
  });

  it("counts a Tackle earlier in the same wrap", () => {
    const wrapPicks = [["tackle", "tackle"], []];

    expect(tackleTakenAt(wrapPicks, 0, 1)).toBe(true);
  });

  it("stays available when no earlier pick tackles", () => {
    const wrapPicks = [["one"], ["tackle"]];

    expect(tackleTakenAt(wrapPicks, 1, 0)).toBe(false);
  });
});

describe("Tackle lines in the card data", () => {
  it("marks every T line as stealing the ball", () => {
    const tacklers = [bucker, cast, thresher, veteranBoar, veteranCinder];

    for (const attacker of tacklers) {
      expect(getPlaybookResult(attacker, "tackle").stealsBall).toBe(true);
    }
  });
});
