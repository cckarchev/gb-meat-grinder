/** State transitions that keep the attack plan legal after a state change or plan edit. */

import { clampChargeAttackIndex } from '@/core/attacks/attackStructure';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import { clampAttackPlan } from '@/core/plan/clampAttackPlan';
import type { MeatGrinderState } from '@/gbMeatGrinder/reducer/reducer.types';
import {
  activeBaseCountOf,
  clampParams,
} from '@/gbMeatGrinder/reducer/stateSelectors';

const clampPlan = (state: MeatGrinderState, plan: AttackPlan): AttackPlan => {
  return clampAttackPlan(plan, clampParams(state));
};

/** Apply `patch`, then re-clamp the existing plan against the patched state. */
export const withReclampedPlan = (
  state: MeatGrinderState,
  patch: Partial<MeatGrinderState>,
): MeatGrinderState => {
  const next = { ...state, ...patch };

  return { ...next, attackPlan: clampPlan(next, state.attackPlan) };
};

/**
 * Like `withReclampedPlan`, but first pulls the charge row back onto an active
 * base attack when the patch leaves the model charging.
 */
export const withReclampedCharge = (
  state: MeatGrinderState,
  patch: Partial<MeatGrinderState>,
): MeatGrinderState => {
  const patched = { ...state, ...patch };

  if (!patched.charging) {
    return withReclampedPlan(state, patch);
  }

  const chargeAttackIndex = clampChargeAttackIndex(
    patched.chargeAttackIndex,
    activeBaseCountOf(patched),
  );

  return withReclampedPlan(state, { ...patch, chargeAttackIndex });
};

/** Adopt an edited plan (re-clamped), or keep the state when the edit was a no-op. */
export const applyPlanEdit = (
  state: MeatGrinderState,
  edited: AttackPlan | null,
): MeatGrinderState => {
  if (edited == null) {
    return state;
  }

  return { ...state, attackPlan: clampPlan(state, edited) };
};
