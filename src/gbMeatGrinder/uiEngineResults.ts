import type { DerivedSimulation } from '@/core/activation/simulation.types';

/** Engine results the components read; the rest stays internal to the hook. */
export const UI_ENGINE_RESULT_KEYS = [
  'activeBaseCount',
  'effectiveChargeAttackIndex',
  'effectiveWrapPicks',
  'effectiveBonusTimeByAttack',
  'ignoredDisplayIndex',
  'attacks',
  'rowDamageIfHit',
  'flatDamage',
  'killingBlowIndex',
] as const satisfies readonly (keyof DerivedSimulation)[];

export type UiEngineResults = Pick<
  DerivedSimulation,
  (typeof UI_ENGINE_RESULT_KEYS)[number]
>;

export const pickUiEngineResults = (
  derived: DerivedSimulation,
): UiEngineResults => {
  const entries = UI_ENGINE_RESULT_KEYS.map((key) => {
    return [key, derived[key]];
  });

  // `fromEntries` loses the key-to-value pairing the key list guarantees.
  return Object.fromEntries(entries) as UiEngineResults;
};
