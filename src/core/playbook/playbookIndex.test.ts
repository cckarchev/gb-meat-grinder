import { describe, expect, it } from "vitest";
import {
  cheapestChoiceId,
  getPlaybookResult,
  maxPlaybookNet,
  netSuccessesForChoice,
  playbookIndex,
} from "@/core/playbook/playbookIndex";
import { makeAttacker } from "@/core/testing/fixtures";

/** The fixture playbook's widest column. */
const MAX_NET = 4;

describe("playbookIndex", () => {
  it("indexes every result by id and records the widest column", () => {
    const index = playbookIndex(makeAttacker());

    expect([...index.byId.keys()].sort()).toEqual(
      ["dodge", "four", "gb", "kd", "one", "push", "two"].sort(),
    );

    expect(index.maxNet).toBe(MAX_NET);
  });

  it("caches per attacker object", () => {
    const attacker = makeAttacker();

    expect(playbookIndex(attacker)).toBe(playbookIndex(attacker));
    expect(maxPlaybookNet(attacker)).toBe(MAX_NET);
  });
});

describe("cheapestChoiceId", () => {
  it("returns the first line of the first playbook column", () => {
    expect(cheapestChoiceId(makeAttacker())).toBe("one");
  });
});

describe("lookups", () => {
  const attacker = makeAttacker();

  it("resolves results and columns by id", () => {
    expect(getPlaybookResult(attacker, "two").damage).toBe(2);
    const kdColumn = 3;

    expect(netSuccessesForChoice(attacker, "kd")).toBe(kdColumn);
  });

  it("throws on unknown playbook ids", () => {
    expect(() => getPlaybookResult(attacker, "nope")).toThrow();
    expect(() => netSuccessesForChoice(attacker, "nope")).toThrow();
  });
});
