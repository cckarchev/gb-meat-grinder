import { useMemo } from 'react';
import type { ActivationSummaryInput } from '@/core/activation/summary/activationSummary.types';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/**
 * Engine input shared by the swing projections and the activation summary,
 * memoized on its fields, plus the charge row the engine should use.
 */
export const useActivationInput = () => {
  const {
    attacker,
    hp: targetHp,
    effectiveChargeAttackIndex,
    activeBaseCount,
    startingMomentum,
    effectiveWrapPicks,
    effectiveBonusTimeByAttack,
    ignoredDisplayIndex,
    damageMods,
    specialAbilities,
    attacks,
    rowDamageIfHit,
    flatDamage,
    killingBlowIndex,
  } = useMeatGrinderSimulation();

  const input = useMemo<ActivationSummaryInput>(
    () => ({
      attacker,
      attacks,
      ignoredDisplayIndex,
      killingBlowIndex,
      wrapPicks: effectiveWrapPicks,
      bonusTimeByAttack: effectiveBonusTimeByAttack,
      damageMods,
      specialAbilities,
      rowDamageIfHit,
      flatDamage,
      startingMomentum,
      activeBaseCount,
      targetHp,
    }),
    [
      attacker,
      attacks,
      ignoredDisplayIndex,
      killingBlowIndex,
      effectiveWrapPicks,
      effectiveBonusTimeByAttack,
      damageMods,
      specialAbilities,
      rowDamageIfHit,
      flatDamage,
      startingMomentum,
      activeBaseCount,
      targetHp,
    ],
  );

  return { input, effectiveChargeAttackIndex };
};
