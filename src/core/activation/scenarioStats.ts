/** The scenario's effective combat stats, shared by the simulation and the plan clamp. */

import type {
  ActivationScenario,
  DerivedSimulation,
} from '@/core/activation/simulation.types';
import {
  activeBaseAttackCount,
  effectiveChargeIndex,
} from '@/core/attacks/attackStructure';
import { effectiveEnemyDef } from '@/core/damage/damage';
import type { AttackerData } from '@/data/attackers/attacker.types';

export type ScenarioStatsInput = Pick<
  ActivationScenario,
  | 'influence'
  | 'charging'
  | 'chargeAttackIndex'
  | 'enemyDef'
  | 'enemyKnockedDown'
  | 'enemySnared'
  | 'gangingUp'
  | 'crowdingOut'
>;

export type ScenarioEffectiveStats = Pick<
  DerivedSimulation,
  | 'activeBaseCount'
  | 'effectiveChargeAttackIndex'
  | 'effectiveEnemyDef'
  | 'initialTacModifier'
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
