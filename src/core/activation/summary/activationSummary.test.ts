import { describe, expect, it } from "vitest";
import { sweepingCharge } from "@/data/characterTraits";
import { activationTimeline } from "../../attacks/activationTimeline";
import type { AttackRollContext } from "../../attacks/attackSequence.types";
import { activeTraitFlatDamage } from "../../damage/damage";
import { rowDamageIfAllHit } from "../../damage/rowDamage";
import { NO_ATTACK_INDEX } from "../../shared/constants";
import {
  makeAttacker,
  makeRollContext,
  modsWith,
  NEUTRAL_TARGET_HP,
  NO_MODS,
  orderFor,
} from "../../testing/fixtures";
import {
  activeSwings,
  summarizeActivation,
  swingIsSkipped,
} from "./activationSummary";
import type { ActivationSummaryInput } from "./activationSummary.types";

/** A swing that always rolls exactly `tac` net successes. */
const certainSwing = (attackIndex: number, tac: number): AttackRollContext =>
  makeRollContext({
    attackIndex,
    tac,
    armor: 0,
    defMinRoll: 2,
    pHit: 1,
    netSuccessesNeeded: tac,
    netHitBonus: 0,
    prob: 1,
  });

const flaky = (attackIndex: number, prob: number): AttackRollContext => ({
  ...certainSwing(attackIndex, 2),
  prob,
});

const input = (
  overrides: Partial<ActivationSummaryInput> = {},
): ActivationSummaryInput => {
  const scenario = {
    attacker: makeAttacker(),
    attacks: [certainSwing(0, 2), certainSwing(1, 2)],
    ignoredDisplayIndex: -1,
    killingBlowIndex: -1,
    wrapPicks: [["two"], ["two"]],
    bonusTimeByAttack: [false, false],
    damageMods: NO_MODS,
    activeTraits: {},
    startingMomentum: 0,
    activeBaseCount: 2,
    targetHp: 10,
    enemyKnockedDown: false,
    ...overrides,
  };

  // Derived the way `deriveSimulation` does, unless a test pins them.
  const characterPlayPicks = scenario.wrapPicks.map((row) =>
    row.map(() => null),
  );

  const timeline = activationTimeline(
    { wrapPicks: scenario.wrapPicks, characterPlayPicks },
    {
      attacker: scenario.attacker,
      damageMods: scenario.damageMods,
      activeBaseCount: scenario.activeBaseCount,
      chargeAttackIndex: NO_ATTACK_INDEX,
      targetHp: scenario.targetHp,
      enemyKnockedDown: false,
    },
  );

  const rowDamageIfHit = rowDamageIfAllHit(
    orderFor(scenario.attacker, scenario.activeBaseCount, scenario.damageMods),
    scenario.wrapPicks,
    timeline,
  );

  const flatDamage = activeTraitFlatDamage(
    scenario.attacker,
    scenario.activeTraits,
  );

  return { timeline, rowDamageIfHit, flatDamage, ...scenario };
};

describe("activeSwings", () => {
  const attacks = [certainSwing(0, 2), certainSwing(1, 2), certainSwing(2, 2)];

  it("keeps every swing by default", () => {
    expect(activeSwings(attacks, -1, -1)).toEqual(attacks);
  });

  it("drops the ignored lead swing and everything after the killing blow", () => {
    expect(activeSwings(attacks, 0, 1)).toEqual([attacks[1]]);
  });
});

describe("swingIsSkipped", () => {
  it("plays every swing when nothing is ignored and nothing kills", () => {
    expect(swingIsSkipped(0, -1, -1)).toBe(false);
    expect(swingIsSkipped(2, -1, -1)).toBe(false);
  });

  it("skips the swing Resilience ignores", () => {
    expect(swingIsSkipped(0, 0, -1)).toBe(true);
    expect(swingIsSkipped(1, 0, -1)).toBe(false);
  });

  it("plays the killing blow and skips every swing after it", () => {
    expect(swingIsSkipped(1, -1, 1)).toBe(false);
    expect(swingIsSkipped(2, -1, 1)).toBe(true);
  });
});

/** The default input's two `two` picks. */
const ALL_HIT_DAMAGE = 4;
const COIN_FLIP = 0.5;

describe("summarizeActivation momentum", () => {
  it("totals damage and momentum when every pick hits", () => {
    const summary = summarizeActivation(input());

    expect(summary.totalDamageIfAllHit).toBe(ALL_HIT_DAMAGE);
    expect(summary.netMomentumIfAllHit).toBe(2);
    expect(summary.netMomentumTooltip).toBe("+2 from momentous results.");
    expect(summary.damageDealtTooltip).toBe("4 from card pips = 4.");
  });

  it("counts the killing blow and stops at it", () => {
    const summary = summarizeActivation(
      input({ targetHp: 2, killingBlowIndex: 0 }),
    );

    expect(summary.activeAttacks).toHaveLength(1);
    expect(summary.totalDamageIfAllHit).toBe(2);
    expect(summary.netMomentumIfAllHit).toBe(2);

    expect(summary.netMomentumTooltip).toBe(
      "+1 from momentous results; +1 killing blow.",
    );
  });

  it("charges Bonus Time against net momentum", () => {
    const summary = summarizeActivation(
      input({ startingMomentum: 1, bonusTimeByAttack: [true, false] }),
    );

    expect(summary.netMomentumIfAllHit).toBe(1);

    expect(summary.netMomentumTooltip).toBe(
      "+2 from momentous results; -1 Bonus Time.",
    );
  });

  it("nets only the killing blow when no swing happens", () => {
    const summary = summarizeActivation(
      input({ attacks: [], killingBlowIndex: 0 }),
    );

    expect(summary.netMomentumIfAllHit).toBe(1);
  });
});

describe("summarizeActivation Sweeping Charge", () => {
  it("itemizes Sweeping Charge on a charge that picks damage", () => {
    const attacker = makeAttacker({ characterTraits: [sweepingCharge] });
    const wrapPicks = [["two"], ["two"]];
    const chargeRow = 0;

    const timeline = activationTimeline(
      { wrapPicks, characterPlayPicks: [[null], [null]] },
      {
        attacker,
        damageMods: NO_MODS,
        activeBaseCount: 2,
        chargeAttackIndex: chargeRow,
        targetHp: NEUTRAL_TARGET_HP,
        enemyKnockedDown: false,
      },
    );

    const rowDamageIfHit = rowDamageIfAllHit(
      orderFor(attacker, 2),
      wrapPicks,
      timeline,
    );

    const summary = summarizeActivation(
      input({ attacker, wrapPicks, timeline, rowDamageIfHit }),
    );

    const sweepingChargeDamage = 3;

    expect(summary.totalDamageIfAllHit).toBe(
      ALL_HIT_DAMAGE + sweepingChargeDamage,
    );

    expect(summary.damageDealtTooltip).toBe(
      "4 from card pips; +3 Sweeping Charge = 7.",
    );
  });
});

describe("summarizeActivation damage tooltip", () => {
  it("itemizes Tough Hide, buffs and activated traits", () => {
    const attacker = makeAttacker({
      characterTraits: [
        { id: "gore", label: "Gore", tooltip: "", active: true, flatDamage: 2 },
      ],
    });

    const summary = summarizeActivation(
      input({
        attacker,
        damageMods: modsWith({ toughHide: true, buffs: { sharp: true } }),
        activeTraits: { gore: true },
      }),
    );

    expect(summary.totalDamageIfAllHit).toBe(ALL_HIT_DAMAGE - 2 + 2 + 2);

    expect(summary.damageDealtTooltip).toBe(
      "4 from card pips; -2 Tough Hide; +2 Sharp; +2 Gore = 6.",
    );
  });

  it("explains when nothing deals damage", () => {
    const summary = summarizeActivation(input({ wrapPicks: [[null], [null]] }));

    expect(summary.damageDealtTooltip).toBe(
      "No selected playbook lines deal card damage to HP (after Tough Hide).",
    );
  });

  it("itemizes damage only through the killing blow", () => {
    const summary = summarizeActivation(
      input({
        attacks: [certainSwing(0, 2), certainSwing(1, 2), certainSwing(2, 2)],
        wrapPicks: [["two"], ["two"], ["two"]],
        bonusTimeByAttack: [false, false, false],
        attacker: makeAttacker({ inf: 3 }),
        activeBaseCount: 3,
        targetHp: ALL_HIT_DAMAGE,
        killingBlowIndex: 1,
      }),
    );

    expect(summary.totalDamageIfAllHit).toBe(ALL_HIT_DAMAGE);
    expect(summary.damageDealtTooltip).toBe("4 from card pips = 4.");
  });
});

describe("summarizeActivation odds", () => {
  it("fails the plan unless every swing lands its line", () => {
    const summary = summarizeActivation(
      input({ attacks: [flaky(0, COIN_FLIP), flaky(1, COIN_FLIP)] }),
    );

    expect(summary.planFailureProbability).toBeCloseTo(
      1 - COIN_FLIP * COIN_FLIP,
    );
  });

  it("still rolls the swings after the killing blow in case an earlier one whiffs", () => {
    // Net 0, 1 or 2 with odds 1/4, 1/2, 1/4: deals 0, 1 (`one`) or 2.
    const shaky = makeRollContext({
      attackIndex: 0,
      tac: 2,
      armor: 0,
      defMinRoll: 4,
      pHit: 0.5,
      netSuccessesNeeded: 2,
      netHitBonus: 0,
      prob: 0.25,
    });

    const summary = summarizeActivation(
      input({
        attacks: [shaky, certainSwing(1, 2), certainSwing(2, 2)],
        attacker: makeAttacker({ inf: 3 }),
        activeBaseCount: 3,
        wrapPicks: [["two"], ["two"], ["two"]],
        bonusTimeByAttack: [false, false, false],
        targetHp: ALL_HIT_DAMAGE,
        killingBlowIndex: 1,
      }),
    );

    // The plan ends at the second swing, but the third always makes up the gap.
    expect(summary.activeAttacks).toHaveLength(2);
    expect(summary.planFailureProbability).toBeCloseTo(1 - shaky.prob);
    expect(summary.killProbability).toBeCloseTo(1);
    expect(summary.expectedDamage).toBeCloseTo(ALL_HIT_DAMAGE);
    expect(summary.expectedHpRemaining).toBeCloseTo(0);
  });

  it("reports kill odds and the likely damage band", () => {
    const lethal = summarizeActivation(input({ targetHp: ALL_HIT_DAMAGE }));
    const short = summarizeActivation(input({ targetHp: 5 }));

    expect(lethal.killProbability).toBe(1);
    expect(lethal.expectedDamage).toBe(ALL_HIT_DAMAGE);
    expect(lethal.damageRange).toEqual({ low: 4, high: 4 });
    expect(short.killProbability).toBe(0);
    expect(short.expectedHpRemaining).toBe(1);
  });
});
