import { describe, expect, it } from "vitest";
import { maxPlaybookColumnForRow } from "@/core/attacks/maxPlaybookColumn";
import type { AttackPlanClampParams } from "@/core/plan/attackPlan.types";
import {
  makeAttacker,
  makeRollParams,
  modsWith,
  TEAMMATE_GUILD,
} from "@/core/testing/fixtures";

describe("maxPlaybookColumnForRow", () => {
  const params = (tac: number): AttackPlanClampParams => ({
    ...makeRollParams({ attacker: makeAttacker({ tac }) }),
    enemyKnockedDown: false,
  });

  const emptyPlan = {
    wrapPicks: [[null], [null]],
    characterPlayPicks: [[null], [null]],
  };

  it("reads the clamp params to find the column a row reaches", () => {
    // TAC vs ARM 0 with no other modifiers: the row reaches column TAC.
    const tac = 4;

    expect(maxPlaybookColumnForRow(emptyPlan, 0, params(tac))).toBe(tac);
    expect(maxPlaybookColumnForRow(emptyPlan, 0, params(2))).toBe(2);
  });
});

describe("maxPlaybookColumnForRow with Instruction", () => {
  it("adds the net hits gained to the first swing only", () => {
    const params: AttackPlanClampParams = {
      ...makeRollParams({
        attacker: makeAttacker({ tac: 2, guild: TEAMMATE_GUILD }),
        damageMods: modsWith({ buffs: { coach: true } }),
      }),
      enemyKnockedDown: false,
    };

    const plan = {
      wrapPicks: [[null], [null]],
      characterPlayPicks: [[null], [null]],
    };

    const instructedColumn = 4;

    expect(maxPlaybookColumnForRow(plan, 0, params)).toBe(instructedColumn);
    expect(maxPlaybookColumnForRow(plan, 1, params)).toBe(2);
  });
});
