import { useMemo } from 'react';
import type { ActivationSummaryInput } from '@/core/activation/summary/activationSummary.types';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

/**
 * Engine input shared by the swing projections and the activation summary,
 * memoized on its fields.
 */
export const useActivationInput = (): ActivationSummaryInput => {
  const {
    attacker,
    hp: targetHp,
    activeBaseCount,
    startingMomentum,
    effectiveWrapPicks,
    effectiveBonusTimeByAttack,
    ignoredDisplayIndex,
    damageMods,
    activeTraits,
    attacks,
    timeline,
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
      activeTraits,
      timeline,
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
      activeTraits,
      timeline,
      rowDamageIfHit,
      flatDamage,
      startingMomentum,
      activeBaseCount,
      targetHp,
    ],
  );

  return input;
};
