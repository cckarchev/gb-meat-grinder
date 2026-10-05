import { useMemo } from 'react';
import type { ActivationSummaryInput } from '@/core/activation/summary/activationSummary.types';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/**
 * Engine input shared by the swing projections and the activation summary,
 * memoized on its fields, plus the charge row the engine should use.
 */
export const useActivationInput = () => {
  const {
    attacker,
    hp: targetHp,
    charging,
    chargeAttackIndex,
    activeBaseCount,
    startingMomentum,
    effectiveWrapPicks,
    effectiveBonusTimeByAttack,
    ignoredAttackIndex,
    damageMods,
    specialAbilities,
    attacks,
    killingBlowIndex,
  } = useMeatGrinderSimulation();

  const effectiveChargeAttackIndex = charging
    ? chargeAttackIndex
    : NO_ATTACK_INDEX;

  const input = useMemo<ActivationSummaryInput>(
    () => ({
      attacker,
      attacks,
      ignoredAttackIndex,
      killingBlowIndex,
      wrapPicks: effectiveWrapPicks,
      bonusTimeByAttack: effectiveBonusTimeByAttack,
      damageMods,
      specialAbilities,
      startingMomentum,
      activeBaseCount,
      targetHp,
    }),
    [
      attacker,
      attacks,
      ignoredAttackIndex,
      killingBlowIndex,
      effectiveWrapPicks,
      effectiveBonusTimeByAttack,
      damageMods,
      specialAbilities,
      startingMomentum,
      activeBaseCount,
      targetHp,
    ],
  );

  return { input, effectiveChargeAttackIndex };
};
