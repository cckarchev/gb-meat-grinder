import { describe, expect, it } from "vitest";
import { sanitizeCharacterPlayPicks } from "@/core/characterPlays/sanitizeCharacterPlayPicks";
import { makeAttacker, orderFor } from "@/core/testing/fixtures";

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
