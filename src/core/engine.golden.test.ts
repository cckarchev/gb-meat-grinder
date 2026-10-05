/**
 * Golden characterization of the whole engine pipeline, run against the real
 * attacker data through `deriveSimulation`. It builds deterministic plans with
 * a couple of pick strategies, and snapshots every derived value. Its job is to
 * catch behavior drift during refactors: an intended rules change should
 * update the snapshot on purpose.
 */

import { describe, expect, it } from 'vitest';
import { ATTACKERS } from '@/attackers/registry';
import { activationAttackIndices } from '@/core/attackRows';
import { activeBaseAttackCount, attackArraySize } from '@/core/attackStructure';
import { characterPlayAvailabilityForPick } from '@/core/characterPlayPicks';
import { clampAttackPlan } from '@/core/clampAttackPlan';
import {
  availableBuffs,
  effectiveArmor,
  effectiveDamageForChoice,
  effectiveEnemyDef,
  specialAbilityFlatDamage,
} from '@/core/damage';
import { damageQuantile, planDamageOutcome } from '@/core/killOdds';
import {
  momentumAfterAttackInclusive,
  sanitizeBonusTimeFlags,
} from '@/core/momentum';
import { formatWrapRowSelectionLabel } from '@/core/playbookLabels';
import {
  damageIfAllHitsWrap,
  damageModifierBreakdownWrap,
} from '@/core/rowDamage';
import { deriveSimulation } from '@/core/simulation';
import { maxPlaybookColumnForRow } from '@/core/swingModifiers';
import {
  choiceUsesCharacterPlay,
  defaultCharacterPlayPicksWrap,
  defaultWrapPicks,
  wrapSlotBudget,
} from '@/core/wrapSlots';
import type { AttackerData } from '@/types/core/attacker';
import type {
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
  PlaybookResult,
  WrapPick,
} from '@/types/core/playbook';
import type { MeatGrinderState } from '@/types/gbMeatGrinder/reducer';

const ROUNDING_DIGITS = 6;
const PLAN_SETTLE_PASSES = 6;
const LOW_QUANTILE = 0.1;
const HIGH_QUANTILE = 0.9;
const CHARGE_ROW = 0;
const NO_CHARGE = -1;

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
  allSpecialAbilities: boolean;
  startingMomentum: number;
  bonusTimeOnFirst: boolean;
  initialTacModifier: number;
};

type Strategy = 'damage' | 'utility' | 'knockdown';

const BASE_SCENARIO: Scenario = {
  name: 'base',
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
  allSpecialAbilities: false,
  startingMomentum: 0,
  bonusTimeOnFirst: false,
  initialTacModifier: 0,
};

const SCENARIOS: Scenario[] = [
  BASE_SCENARIO,
  { ...BASE_SCENARIO, name: 'soft target', enemyDef: 3, armor: 0, hp: 8 },
  { ...BASE_SCENARIO, name: 'hard target', enemyDef: 5, armor: 2, hp: 18 },
  {
    ...BASE_SCENARIO,
    name: 'charge into stance',
    charging: true,
    enemyDefensiveStance: true,
  },
  { ...BASE_SCENARIO, name: 'cover', enemyHasCover: true },
  {
    ...BASE_SCENARIO,
    name: 'knocked down and snared',
    enemyDef: 3,
    enemyKnockedDown: true,
    enemySnared: true,
  },
  {
    ...BASE_SCENARIO,
    name: 'tough hide with buffs',
    toughHide: true,
    allBuffs: true,
  },
  {
    ...BASE_SCENARIO,
    name: 'resilient',
    enemyResilience: true,
    allSpecialAbilities: true,
  },
  {
    ...BASE_SCENARIO,
    name: 'bonus time',
    startingMomentum: 1,
    bonusTimeOnFirst: true,
    initialTacModifier: 1,
  },
];

const STRATEGIES: Strategy[] = ['damage', 'utility', 'knockdown'];

const round = (value: number): number => {
  return Number(value.toFixed(ROUNDING_DIGITS));
};

const KNOCKDOWN_PRIORITY = 4;

const utilityScore = (result: PlaybookResult, strategy: Strategy): number => {
  if (strategy === 'damage') {
    return 0;
  }

  if (strategy === 'knockdown' && result.appliesKnockDown) {
    return KNOCKDOWN_PRIORITY;
  }

  if (result.picksCharacterPlay) {
    return 3;
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
      const score = utilityWeight * 100 + damage * damageWeight;

      if (score > bestScore) {
        best = result.id;
        bestScore = score;
      }
    }
  }

  return best;
};

const runScenario = (
  attacker: AttackerData,
  scenario: Scenario,
  strategy: Strategy,
) => {
  const size = attackArraySize(attacker);

  const activeBaseCount = activeBaseAttackCount(
    attacker,
    attacker.inf,
    scenario.charging,
  );

  const chargeAttackIndex = scenario.charging ? CHARGE_ROW : NO_CHARGE;

  const damageMods: PlaybookDamageMods = {
    toughHide: scenario.toughHide,
    buffs: Object.fromEntries(
      availableBuffs(attacker).map((buff) => [buff.id, scenario.allBuffs]),
    ),
  };

  const specialAbilities = Object.fromEntries(
    (attacker.specialAbilities ?? []).map((ability) => [
      ability.id,
      scenario.allSpecialAbilities,
    ]),
  );

  const armor = effectiveArmor(attacker, scenario.armor, damageMods);

  const enemyDef = effectiveEnemyDef(
    scenario.enemyDef,
    scenario.enemyKnockedDown,
    scenario.enemySnared,
  );

  const requestedBonusTime = Array.from(
    { length: size },
    (_, i) => scenario.bonusTimeOnFirst && i === 0,
  );

  let wrapPicks: WrapPick[][] = defaultWrapPicks(size);

  let characterPlayPicks: CharacterPlayPickSlot[][] =
    defaultCharacterPlayPicksWrap(size);

  const clamp = () => {
    const clamped = clampAttackPlan(
      attacker,
      wrapPicks,
      characterPlayPicks,
      chargeAttackIndex,
      armor,
      scenario.enemyHasCover,
      scenario.enemyDefensiveStance,
      damageMods,
      enemyDef,
      requestedBonusTime,
      scenario.initialTacModifier,
      activeBaseCount,
      scenario.enemyKnockedDown,
    );

    wrapPicks = clamped.wrapPicks;
    characterPlayPicks = clamped.characterPlayPicks;
  };

  clamp();

  for (let pass = 0; pass < PLAN_SETTLE_PASSES; pass++) {
    const order = activationAttackIndices(
      attacker,
      wrapPicks,
      damageMods,
      activeBaseCount,
    );

    for (const row of order) {
      const maxNet = maxPlaybookColumnForRow(
        attacker,
        wrapPicks,
        characterPlayPicks,
        row,
        chargeAttackIndex,
        armor,
        scenario.enemyHasCover,
        scenario.enemyDefensiveStance,
        damageMods,
        enemyDef,
        requestedBonusTime,
        scenario.initialTacModifier,
        activeBaseCount,
      );

      for (let slot = 0; slot < wrapPicks[row].length; slot++) {
        const budget = wrapSlotBudget(attacker, maxNet, slot);
        const line = pickLine(attacker, budget, damageMods, strategy);

        wrapPicks[row][slot] = line;

        if (!choiceUsesCharacterPlay(attacker, line)) {
          characterPlayPicks[row][slot] = null;
          continue;
        }

        const { available } = characterPlayAvailabilityForPick(
          attacker,
          wrapPicks,
          characterPlayPicks,
          row,
          slot,
          damageMods,
          activeBaseCount,
        );

        const lastAvailable = available[available.length - 1];

        characterPlayPicks[row][slot] = lastAvailable?.id ?? null;
      }
    }

    clamp();
  }

  const bonusTimeByAttack = sanitizeBonusTimeFlags(
    attacker,
    wrapPicks,
    damageMods,
    scenario.startingMomentum,
    requestedBonusTime,
    activeBaseCount,
  );

  const state: MeatGrinderState = {
    attackerId: attacker.id,
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
    startingMomentum: scenario.startingMomentum,
    gangingUp: scenario.initialTacModifier,
    crowdingOut: 0,
    bonusTimeByAttack,
    damageMods,
    specialAbilities,
    attackPlan: { wrapPicks, characterPlayPicks },
  };

  const { ignoredAttackIndex, effectiveWrapPicks, attacks, killingBlowIndex } =
    deriveSimulation(attacker, state);

  const flatDamage = specialAbilityFlatDamage(attacker, specialAbilities);

  const damageIfAllHits = damageIfAllHitsWrap(
    attacker,
    effectiveWrapPicks,
    damageMods,
    activeBaseCount,
  );

  const outcome = planDamageOutcome(
    attacker,
    attacks,
    effectiveWrapPicks,
    damageMods,
    flatDamage,
    scenario.hp,
  );

  const sortedDistribution = [...outcome.damageDistribution].sort(
    ([a], [b]) => a - b,
  );

  return {
    wrapPicks,
    characterPlayPicks,
    rowLabels: wrapPicks.map((row) =>
      formatWrapRowSelectionLabel(attacker, row, damageMods),
    ),
    bonusTimeByAttack,
    ignoredAttackIndex,
    attacks: attacks.map((attack) => ({
      ...attack,
      pHit: round(attack.pHit),
      prob: round(attack.prob),
      momentumAfter: momentumAfterAttackInclusive(
        attacker,
        wrapPicks,
        damageMods,
        attack.attackIndex,
        scenario.startingMomentum,
        bonusTimeByAttack,
        activeBaseCount,
      ),
    })),
    damageIfAllHits,
    breakdown: damageModifierBreakdownWrap(
      attacker,
      effectiveWrapPicks,
      damageMods,
      activeBaseCount,
    ),
    killingBlowIndex,
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

describe('engine golden scenarios', () => {
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
