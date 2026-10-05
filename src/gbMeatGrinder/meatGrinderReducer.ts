import { attackerById } from '@/attackers/registry';
import {
  nextPlanAfterCharacterPlayPick,
  nextPlanAfterClearWrapContinuation,
  nextPlanAfterWrapChoice,
} from '@/core/attackPlanState';
import {
  activeBaseAttackCount,
  clampChargeAttackIndex,
} from '@/core/attackStructure';
import { clamp } from '@/core/clamp';
import { clampAttackPlan } from '@/core/clampAttackPlan';
import { effectiveArmor, effectiveEnemyDef } from '@/core/damage';
import {
  momentumPoolBeforeBonusTime,
  sanitizeBonusTimeFlags,
} from '@/core/momentum';
import { stateForAttacker } from '@/gbMeatGrinder/meatGrinderInitialState';
import type { AttackerData } from '@/types/core/attacker';
import type {
  AttackPlan,
  AttackPlanClampParams,
} from '@/types/core/attackPlan';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/types/gbMeatGrinder/reducer';

const attackerOf = (s: MeatGrinderState): AttackerData => {
  return attackerById(s.attackerId);
};

/** Active base attacks for the current influence / charge choice. */
const activeBaseCountOf = (s: MeatGrinderState): number => {
  return activeBaseAttackCount(attackerOf(s), s.influence, s.charging);
};

/** Charge row the engine should use: the chosen base, or -1 when not charging. */
const effectiveChargeIndex = (s: MeatGrinderState): number => {
  return s.charging ? s.chargeAttackIndex : -1;
};

const clampParams = (s: MeatGrinderState): AttackPlanClampParams => {
  return {
    attacker: attackerOf(s),
    chargeAttackIndex: effectiveChargeIndex(s),
    armor: effectiveArmor(attackerOf(s), s.armor, s.damageMods),
    enemyHasCover: s.enemyHasCover,
    enemyDefensiveStance: s.enemyDefensiveStance,
    damageMods: s.damageMods,
    enemyDef: effectiveEnemyDef(s.enemyDef, s.enemyKnockedDown, s.enemySnared),
    bonusTimeByAttack: s.bonusTimeByAttack,
    initialTacModifier: s.gangingUp - s.crowdingOut,
    enemyKnockedDown: s.enemyKnockedDown,
    activeBaseCount: activeBaseCountOf(s),
  };
};

const clampPlan = (s: MeatGrinderState, plan: AttackPlan): AttackPlan => {
  return clampAttackPlan(plan, clampParams(s));
};

/** Apply `patch`, then re-clamp the existing plan against the patched state. */
const withReclampedPlan = (
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
const withReclampedCharge = (
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
const applyPlanEdit = (
  state: MeatGrinderState,
  edited: AttackPlan | null | undefined,
): MeatGrinderState => {
  if (edited == null) {
    return state;
  }

  return { ...state, attackPlan: clampPlan(state, edited) };
};

const bonusTimeEqual = (
  a: readonly boolean[],
  b: readonly boolean[],
): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((v, i) => v === b[i]);
};

const sanitizedBonusTime = (
  state: MeatGrinderState,
  flags: boolean[],
): boolean[] => {
  return sanitizeBonusTimeFlags(
    attackerOf(state),
    state.attackPlan.wrapPicks,
    state.damageMods,
    state.startingMomentum,
    flags,
    activeBaseCountOf(state),
  );
};

const toggleBonusTime = (
  state: MeatGrinderState,
  attackIndex: number,
  value: boolean,
): MeatGrinderState => {
  if (value) {
    const pool = momentumPoolBeforeBonusTime(
      attackerOf(state),
      state.attackPlan.wrapPicks,
      state.damageMods,
      attackIndex,
      state.startingMomentum,
      state.bonusTimeByAttack,
      activeBaseCountOf(state),
    );

    if (pool < 1) {
      return state;
    }
  }

  const nextFlags = [...state.bonusTimeByAttack];

  nextFlags[attackIndex] = value;

  return { ...state, bonusTimeByAttack: sanitizedBonusTime(state, nextFlags) };
};

const resanitizeBonusTime = (state: MeatGrinderState): MeatGrinderState => {
  const sanitized = sanitizedBonusTime(state, state.bonusTimeByAttack);

  if (bonusTimeEqual(sanitized, state.bonusTimeByAttack)) {
    return state;
  }

  return { ...state, bonusTimeByAttack: sanitized };
};

export const meatGrinderReducer = (
  state: MeatGrinderState,
  action: MeatGrinderAction,
): MeatGrinderState => {
  switch (action.type) {
    case 'reset': {
      // Reset everything to defaults but keep the currently selected model.
      return stateForAttacker(attackerOf(state));
    }
    case 'selectAttacker': {
      if (action.id === state.attackerId) {
        return state;
      }

      return stateForAttacker(attackerById(action.id), state);
    }
    case 'enemyDef': {
      return withReclampedPlan(state, { enemyDef: action.value });
    }
    case 'armor': {
      return withReclampedPlan(state, { armor: action.value });
    }
    case 'hp': {
      return { ...state, hp: action.value };
    }
    case 'influence': {
      const influence = clamp(action.value, 0, attackerOf(state).inf);

      return withReclampedCharge(state, { influence });
    }
    case 'charging': {
      return withReclampedCharge(state, { charging: action.value });
    }
    case 'chargeAttackIndex': {
      const chargeAttackIndex = clampChargeAttackIndex(
        action.value,
        activeBaseCountOf(state),
      );

      return withReclampedPlan(state, { chargeAttackIndex });
    }
    case 'enemyHasCover': {
      return withReclampedPlan(state, { enemyHasCover: action.value });
    }
    case 'enemyDefensiveStance': {
      return withReclampedPlan(state, { enemyDefensiveStance: action.value });
    }
    case 'enemyKnockedDown': {
      return withReclampedPlan(state, { enemyKnockedDown: action.value });
    }
    case 'enemySnared': {
      return withReclampedPlan(state, { enemySnared: action.value });
    }
    case 'enemyResilience': {
      // Resilience only changes which swings are *ignored* downstream; it never
      // alters the editable plan's validity, so no re-clamp is needed.
      return { ...state, enemyResilience: action.value };
    }
    case 'startingMomentum': {
      return { ...state, startingMomentum: action.value };
    }
    case 'gangingUpRaw': {
      const range = attackerOf(state).gangingUp;
      const gangingUp = clamp(action.value, range.min, range.max);

      return withReclampedPlan(state, { gangingUp });
    }
    case 'crowdingOutRaw': {
      const range = attackerOf(state).crowdingOut;
      const crowdingOut = clamp(action.value, range.min, range.max);

      return withReclampedPlan(state, { crowdingOut });
    }
    case 'damageMods': {
      return withReclampedPlan(state, { damageMods: action.value });
    }
    case 'specialAbility': {
      const specialAbilities = {
        ...state.specialAbilities,
        [action.id]: action.value,
      };

      return { ...state, specialAbilities };
    }
    case 'bonusTime': {
      return toggleBonusTime(state, action.attackIndex, action.value);
    }
    case 'sanitizeBonusTime': {
      return resanitizeBonusTime(state);
    }
    case 'wrapChoice': {
      const edited = nextPlanAfterWrapChoice(
        attackerOf(state),
        state.attackPlan,
        action.attackIndex,
        action.pickIndex,
        action.id,
      );

      return applyPlanEdit(state, edited);
    }
    case 'clearWrapContinuation': {
      const edited = nextPlanAfterClearWrapContinuation(
        attackerOf(state),
        state.attackPlan,
        action.attackIndex,
      );

      return applyPlanEdit(state, edited);
    }
    case 'characterPlayPick': {
      const edited = nextPlanAfterCharacterPlayPick(
        attackerOf(state),
        state.attackPlan,
        action.attackIndex,
        action.pickIndex,
        action.pick,
        state.damageMods,
        activeBaseCountOf(state),
      );

      return applyPlanEdit(state, edited);
    }
    default: {
      const _exhaustive: never = action;

      return _exhaustive;
    }
  }
};
