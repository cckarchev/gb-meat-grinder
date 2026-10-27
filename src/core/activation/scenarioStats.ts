/**
 * The scenario's effective combat stats, shared by the simulation and the plan
 * clamp.
 */

import type { AttackerData } from "@/data/attackers/attacker.types";
import {
  activeBaseAttackCount,
  effectiveChargeIndex,
} from "../attacks/attackStructure";
import { effectiveEnemyDef } from "../damage/damage";
import type { ActivationScenario, DerivedSimulation } from "./simulation.types";

export type ScenarioStatsInput = Pick<
  ActivationScenario,
  | "influence"
  | "charging"
  | "chargeAttackIndex"
  | "enemyDef"
  | "enemyKnockedDown"
  | "enemySnared"
  | "gangingUp"
  | "crowdingOut"
>;

type ScenarioEffectiveStats = Pick<
  DerivedSimulation,
  | "activeBaseCount"
  | "effectiveChargeAttackIndex"
  | "effectiveEnemyDef"
  | "initialTacModifier"
>;

export const scenarioEffectiveStats = (
  attacker: AttackerData,
  scenario: ScenarioStatsInput,
): ScenarioEffectiveStats => {
  const activeBaseCount = activeBaseAttackCount(
    attacker,
    scenario.influence,
    scenario.charging,
  );

  const effectiveChargeAttackIndex = effectiveChargeIndex(
    scenario.charging,
    scenario.chargeAttackIndex,
  );

  const enemyDef = effectiveEnemyDef(
    scenario.enemyDef,
    scenario.enemyKnockedDown,
    scenario.enemySnared,
  );

  const initialTacModifier = scenario.gangingUp - scenario.crowdingOut;

  return {
    activeBaseCount,
    effectiveChargeAttackIndex,
    effectiveEnemyDef: enemyDef,
    initialTacModifier,
  };
};
