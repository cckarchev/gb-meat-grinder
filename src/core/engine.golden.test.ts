/**
 * Golden characterization of the whole engine pipeline, run against the real
 * attacker data through `deriveSimulation`. It builds deterministic plans with
 * a couple of pick strategies, and snapshots every derived value. Its job is to
 * catch behavior drift during refactors: an intended rules change should
 * update the snapshot on purpose.
 */

import { describe, expect, it } from "vitest";
import type { AttackerData } from "@/data/attackers/attacker.types";
import { ATTACKERS } from "@/data/attackers/registry";
import { sanitizeBonusTimeFlags } from "./activation/bonusTimeFlags";
import { momentumAfterAttackInclusive } from "./activation/momentum";
import { deriveSimulation } from "./activation/simulation";
import type { ActivationScenario } from "./activation/simulation.types";
import { activatableTraits, availableBuffs } from "./attackers/buffsAndTraits";
import { activationAttackIndices } from "./attacks/attackRows";
import {
  activeBaseAttackCount,
  attackArraySize,
} from "./attacks/attackStructure";
import { maxPlaybookColumnForRow } from "./attacks/maxPlaybookColumn";
import { characterPlayAvailabilityForPick } from "./character-plays/characterPlayUsage";
import { effectiveDamageForChoice, effectiveEnemyDef } from "./damage/damage";
import type { ActivationDamageOutcome } from "./damage/damage.types";
import { damageQuantile } from "./damage/damageDistribution";
import { planDamageOutcome } from "./damage/killOdds";
import { damageModifierBreakdown } from "./damage/rowDamage";
import type {
  AttackPlan,
  AttackPlanClampParams,
} from "./plan/attackPlan.types";
import { clampAttackPlan } from "./plan/clampAttackPlan";
import type {
  PlaybookChoiceId,
  PlaybookDamageMods,
  PlaybookResult,
} from "./playbook/playbook.types";
import { choiceUsesCharacterPlay } from "./playbook/playbookIndex";
import { formatWrapRowSelectionLabel } from "./playbook/playbookLabels";
import {
  defaultCharacterPlayPicks,
  defaultWrapPicks,
  wrapSlotBudget,
} from "./playbook/wrapSlots";
import { NO_ATTACK_INDEX } from "./shared/constants";
import { orderFor } from "./testing/fixtures";

const ROUNDING_DIGITS = 6;
const PLAN_SETTLE_PASSES = 6;
const LOW_QUANTILE = 0.1;
const HIGH_QUANTILE = 0.9;
const CHARGE_ROW = 0;

type Scenario = {
  name: string;
  enemyDef: number;
  armor: number;
  hp: number;
  charging: boolean;
  enemyHasCover: boolean;
  enemyDefensiveStance: boolean;
  enemyKnockedDown: boolean;
  enemySnared: boolean;
  enemyResilience: boolean;
  toughHide: boolean;
  allBuffs: boolean;
  allActiveTraits: boolean;
  startingMomentum: number;
  bonusTimeOnFirst: boolean;
  initialTacModifier: number;
};

type Strategy = "damage" | "utility" | "knockdown";

const BASE_SCENARIO: Scenario = {
  name: "base",
  enemyDef: 4,
  armor: 1,
  hp: 14,
  charging: false,
  enemyHasCover: false,
  enemyDefensiveStance: false,
  enemyKnockedDown: false,
  enemySnared: false,
  enemyResilience: false,
  toughHide: false,
  allBuffs: false,
  allActiveTraits: false,
  startingMomentum: 0,
  bonusTimeOnFirst: false,
  initialTacModifier: 0,
};

const SCENARIOS: Scenario[] = [
  BASE_SCENARIO,
  { ...BASE_SCENARIO, name: "soft target", enemyDef: 3, armor: 0, hp: 8 },
  { ...BASE_SCENARIO, name: "hard target", enemyDef: 5, armor: 2, hp: 18 },
  {
    ...BASE_SCENARIO,
    name: "charge into stance",
    charging: true,
    enemyDefensiveStance: true,
  },
  { ...BASE_SCENARIO, name: "cover", enemyHasCover: true },
  {
    ...BASE_SCENARIO,
    name: "knocked down and snared",
    enemyDef: 3,
    enemyKnockedDown: true,
    enemySnared: true,
  },
  {
    ...BASE_SCENARIO,
    name: "tough hide with buffs",
    toughHide: true,
    allBuffs: true,
  },
  {
    ...BASE_SCENARIO,
    name: "resilient",
    enemyResilience: true,
    allActiveTraits: true,
  },
  {
    ...BASE_SCENARIO,
    name: "bonus time",
    startingMomentum: 1,
    bonusTimeOnFirst: true,
    initialTacModifier: 1,
  },
];

const STRATEGIES: Strategy[] = ["damage", "utility", "knockdown"];

const round = (value: number): number => Number(value.toFixed(ROUNDING_DIGITS));

const KNOCKDOWN_PRIORITY = 4;
const CHARACTER_PLAY_PRIORITY = 3;

/** Puts any utility ahead of raw damage in a line's score. */
const UTILITY_SCALE = 100;

const utilityScore = (result: PlaybookResult, strategy: Strategy): number => {
  if (strategy === "damage") {
    return 0;
  }

  if (strategy === "knockdown" && result.appliesKnockDown) {
    return KNOCKDOWN_PRIORITY;
  }

  if (result.picksCharacterPlay) {
    return CHARACTER_PLAY_PRIORITY;
  }

  if (result.appliesKnockDown) {
    return 2;
  }

  if (result.clearsCover) {
    return 1;
  }

  return 0;
};

/** Best line within `budget` for the strategy, first one wins on ties. */
const pickLine = (
  attacker: AttackerData,
  budget: number,
  mods: PlaybookDamageMods,
  strategy: Strategy,
): PlaybookChoiceId | null => {
  let best: PlaybookChoiceId | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const column of attacker.playbook) {
    if (column.netSuccesses > budget) {
      continue;
    }

    for (const result of column.results) {
      const damage = effectiveDamageForChoice(attacker, result.id, mods);
      const utilityWeight = utilityScore(result, strategy);
      const damageWeight = 1 / (1 + utilityWeight * 10);
      const score = utilityWeight * UTILITY_SCALE + damage * damageWeight;

      if (score > bestScore) {
        best = result.id;
        bestScore = score;
      }
    }
  }

  return best;
};

type ScenarioSetup = {
  activeBaseCount: number;
  damageMods: PlaybookDamageMods;
  activeTraits: Record<string, boolean>;
  requestedBonusTime: boolean[];
  clampParams: AttackPlanClampParams;
};

/** The engine inputs a scenario turns into for one attacker. */
const scenarioSetup = (
  attacker: AttackerData,
  scenario: Scenario,
): ScenarioSetup => {
  const size = attackArraySize(attacker);

  const activeBaseCount = activeBaseAttackCount(
    attacker,
    attacker.inf,
    scenario.charging,
  );

  const chargeAttackIndex = scenario.charging ? CHARGE_ROW : NO_ATTACK_INDEX;

  const damageMods: PlaybookDamageMods = {
    toughHide: scenario.toughHide,
    // Burning was a Blacksmiths buff; it rides with the buffs so the
    // Burning Passion snapshots keep their coverage.
    targetBurning: scenario.allBuffs,
    // So does a named model engaging the target, for models with Assist.
    assistEngaged: scenario.allBuffs,
    buffs: Object.fromEntries(
      availableBuffs(attacker).map((buff) => [buff.id, scenario.allBuffs]),
    ),
  };

  const activeTraits = Object.fromEntries(
    activatableTraits(attacker).map((trait) => [
      trait.id,
      scenario.allActiveTraits,
    ]),
  );

  const enemyDef = effectiveEnemyDef(
    scenario.enemyDef,
    scenario.enemyKnockedDown,
    scenario.enemySnared,
  );

  const requestedBonusTime = Array.from(
    { length: size },
    (_, i) => scenario.bonusTimeOnFirst && i === 0,
  );

  const clampParams: AttackPlanClampParams = {
    attacker,
    chargeAttackIndex,
    armor: scenario.armor,
    enemyHasCover: scenario.enemyHasCover,
    enemyDefensiveStance: scenario.enemyDefensiveStance,
    damageMods,
    enemyDef,
    bonusTimeByAttack: requestedBonusTime,
    initialTacModifier: scenario.initialTacModifier,
    enemyKnockedDown: scenario.enemyKnockedDown,
    activeBaseCount,
    targetHp: scenario.hp,
  };

  return {
    activeBaseCount,
    damageMods,
    activeTraits,
    requestedBonusTime,
    clampParams,
  };
};

/** Picks the strategy's line for every slot of one row, in place. */
const pickRow = (
  plan: AttackPlan,
  clampParams: AttackPlanClampParams,
  row: number,
  strategy: Strategy,
): void => {
  const { attacker, damageMods } = clampParams;
  const { wrapPicks, characterPlayPicks } = plan;
  const maxNet = maxPlaybookColumnForRow(plan, row, clampParams);

  for (let slot = 0; slot < wrapPicks[row].length; slot++) {
    const budget = wrapSlotBudget(attacker, maxNet, slot);
    const line = pickLine(attacker, budget, damageMods, strategy);

    wrapPicks[row][slot] = line;

    if (!choiceUsesCharacterPlay(attacker, line)) {
      characterPlayPicks[row][slot] = null;
      continue;
    }

    const { available } = characterPlayAvailabilityForPick(clampParams, plan, {
      attackIndex: row,
      pickIndex: slot,
    });

    const lastAvailable = available[available.length - 1];

    characterPlayPicks[row][slot] = lastAvailable?.id ?? null;
  }
};

/**
 * Picks lines and re-clamps until the plan settles: each pass can unlock or
 * remove picks the previous one could not see.
 */
const settledPlan = (
  clampParams: AttackPlanClampParams,
  strategy: Strategy,
): AttackPlan => {
  const size = attackArraySize(clampParams.attacker);
  const initial: AttackPlan = {
    wrapPicks: defaultWrapPicks(size),
    characterPlayPicks: defaultCharacterPlayPicks(size),
  };

  let plan = clampAttackPlan(initial, clampParams);

  for (let pass = 0; pass < PLAN_SETTLE_PASSES; pass++) {
    const order = activationAttackIndices(clampParams, plan.wrapPicks);

    for (const row of order) {
      pickRow(plan, clampParams, row, strategy);
    }

    plan = clampAttackPlan(plan, clampParams);
  }

  return plan;
};

/** The app state a scenario and its settled plan stand for. */
const scenarioActivation = (
  attacker: AttackerData,
  scenario: Scenario,
  setup: ScenarioSetup,
  attackPlan: AttackPlan,
): ActivationScenario => {
  const bonusTimeByAttack = sanitizeBonusTimeFlags({
    attacker,
    wrapPicks: attackPlan.wrapPicks,
    damageMods: setup.damageMods,
    startingMomentum: scenario.startingMomentum,
    bonusTimeByAttack: setup.requestedBonusTime,
    activeBaseCount: setup.activeBaseCount,
  });

  return {
    enemyDef: scenario.enemyDef,
    armor: scenario.armor,
    hp: scenario.hp,
    influence: attacker.inf,
    charging: scenario.charging,
    chargeAttackIndex: CHARGE_ROW,
    enemyHasCover: scenario.enemyHasCover,
    enemyDefensiveStance: scenario.enemyDefensiveStance,
    enemyKnockedDown: scenario.enemyKnockedDown,
    enemySnared: scenario.enemySnared,
    enemyResilience: scenario.enemyResilience,
    gangingUp: scenario.initialTacModifier,
    crowdingOut: 0,
    bonusTimeByAttack,
    damageMods: setup.damageMods,
    activeTraits: setup.activeTraits,
    attackPlan,
  };
};

/** The odds of a plan, rounded so the snapshot is stable. */
const outcomeSnapshot = (outcome: ActivationDamageOutcome) => {
  const sortedDistribution = [...outcome.damageDistribution].sort(
    ([a], [b]) => a - b,
  );

  return {
    killProbability: round(outcome.killProbability),
    expectedDamage: round(outcome.expectedDamage),
    expectedHpRemaining: round(outcome.expectedHpRemaining),
    likelyDamage: [
      damageQuantile(outcome.damageDistribution, LOW_QUANTILE),
      damageQuantile(outcome.damageDistribution, HIGH_QUANTILE),
    ],
    damageDistribution: sortedDistribution.map(([damage, probability]) => [
      damage,
      round(probability),
    ]),
  };
};

const runScenario = (
  attacker: AttackerData,
  scenario: Scenario,
  strategy: Strategy,
) => {
  const setup = scenarioSetup(attacker, scenario);
  const { activeBaseCount, damageMods } = setup;
  const plan = settledPlan(setup.clampParams, strategy);
  const activation = scenarioActivation(attacker, scenario, setup, plan);
  const { wrapPicks, characterPlayPicks } = plan;
  const { bonusTimeByAttack } = activation;

  const momentumParams = {
    attacker,
    wrapPicks,
    damageMods,
    startingMomentum: scenario.startingMomentum,
    bonusTimeByAttack,
    activeBaseCount,
  };

  const simulation = deriveSimulation(attacker, activation);
  const { effectiveWrapPicks, attacks, timeline } = simulation;

  const outcome = planDamageOutcome(
    attacker,
    attacks,
    effectiveWrapPicks,
    damageMods,
    simulation.flatDamage,
    scenario.hp,
    timeline,
  );

  return {
    wrapPicks,
    characterPlayPicks,
    rowLabels: wrapPicks.map((row) =>
      formatWrapRowSelectionLabel(attacker, row, damageMods),
    ),
    bonusTimeByAttack,
    ignoredAttackIndex: simulation.ignoredAttackIndex,
    attacks: attacks.map((attack) => ({
      ...attack,
      pHit: round(attack.pHit),
      prob: round(attack.prob),
      momentumAfter: momentumAfterAttackInclusive(
        attack.attackIndex,
        momentumParams,
      ),
    })),
    damageIfAllHits: simulation.rowDamageIfHit,
    breakdown: damageModifierBreakdown(
      orderFor(attacker, activeBaseCount, damageMods),
      effectiveWrapPicks,
      timeline,
    ),
    killingBlowIndex: simulation.killingBlowIndex,
    ...outcomeSnapshot(outcome),
  };
};

describe("engine golden scenarios", () => {
  for (const attacker of ATTACKERS) {
    describe(attacker.name, () => {
      for (const scenario of SCENARIOS) {
        for (const strategy of STRATEGIES) {
          it(`${scenario.name} (${strategy})`, () => {
            expect(runScenario(attacker, scenario, strategy)).toMatchSnapshot();
          });
        }
      }
    });
  }
});
