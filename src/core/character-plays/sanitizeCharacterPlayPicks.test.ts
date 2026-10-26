import { describe, expect, it } from "vitest";
import { makeAttacker, orderFor } from "../testing/fixtures";
import { sanitizeCharacterPlayPicks } from "./sanitizeCharacterPlayPicks";

describe("sanitizeCharacterPlayPicks", () => {
  const attacker = makeAttacker();

  it("sanitizes illegal and orphaned play picks", () => {
    const baseAttackCount = 3;

    const result = sanitizeCharacterPlayPicks(
      orderFor(attacker, baseAttackCount),
      {
        wrapPicks: [["gb"], ["gb"], ["one"]],
        characterPlayPicks: [["playTac"], ["playTac"], ["playDef"]],
      },
    );

    expect(result).toEqual({
      characterPlayPicks: [["playTac"], ["playDef"], [null]],
      changed: true,
    });
  });
});
