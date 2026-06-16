import { activeAttacker } from '@/attackers/activeAttacker';
import { HP_DEFAULT } from '@/core/constants';
import {
  activeBaseAttackCount,
  attackArraySize,
} from '@/core/attackStructure';
import {
  clampAttackPlanState,
  createInitialAttackPlan,
  nextPlanAfterCharacterPlayPick,
  nextPlanAfterClearWrapContinuation,
  nextPlanAfterWrapChoice,
} from '@/core/attackPlanState';
import {
  DEFAULT_PLAYBOOK_DAMAGE_MODS,
  momentumPoolBeforeBonusTime,
  sanitizeBonusTimeFlags,
} from '@/core/playbook';
import type {
  AttackPlan,
  AttackPlanClampParams,
} from '@/types/core/attackPlan';
import type { MeatGrinderAction, MeatGrinderState } from '@/types/meatGrinder/reducer';

/** Active base attacks for the current influence / charge choice. */
function activeBaseCountOf(s: MeatGrinderState): number {
  return activeBaseAttackCount(s.influence, s.charging);
}

/** Charge row the engine should use: the chosen base, or -1 when not charging. */
function effectiveChargeIndex(s: MeatGrinderState): number {
  return s.charging ? s.chargeAttackIndex : -1;
}

function clampParams(s: MeatGrinderState): AttackPlanClampParams {
  return {
    chargeAttackIndex: effectiveChargeIndex(s),
    armor: s.armor,
    enemyHasCover: s.enemyHasCover,
    enemyDefensiveStance: s.enemyDefensiveStance,
    damageMods: s.damageMods,
    enemyDef: s.enemyDef,
    bonusTimeByAttack: s.bonusTimeByAttack,
    initialTacModifier: s.initialTacModifier,
    activeBaseCount: activeBaseCountOf(s),
  };
}

function clampPlan(s: MeatGrinderState, plan: AttackPlan): AttackPlan {
  return clampAttackPlanState(plan, clampParams(s));
}

function bonusTimeEqual(a: readonly boolean[], b: readonly boolean[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export function createInitialMeatGrinderState(): MeatGrinderState {
  const influence = Math.min(2, activeAttacker.inf);
  const charging = true;
  return {
    enemyDef: 4,
    armor: 1,
    hp: HP_DEFAULT,
    influence,
    charging,
    chargeAttackIndex: 0,
    enemyHasCover: false,
    enemyDefensiveStance: false,
    startingMomentum: 0,
    initialTacModifier: 0,
    bonusTimeByAttack: Array.from({ length: attackArraySize() }, () => false),
    damageMods: DEFAULT_PLAYBOOK_DAMAGE_MODS,
    attackPlan: createInitialAttackPlan(influence, charging),
  };
}

export function meatGrinderReducer(
  state: MeatGrinderState,
  action: MeatGrinderAction,
): MeatGrinderState {
  switch (action.type) {
    case 'enemyDef': {
      const next = { ...state, enemyDef: action.value };
      return {
        ...next,
        attackPlan: clampPlan(next, state.attackPlan),
      };
    }
    case 'armor': {
      const next = { ...state, armor: action.value };
      return {
        ...next,
        attackPlan: clampPlan(next, state.attackPlan),
      };
    }
    case 'hp':
      return { ...state, hp: action.value };
    case 'influence': {
      const influence = Math.max(
        0,
        Math.min(activeAttacker.inf, action.value),
      );
      const withInfluence = { ...state, influence };
      const baseCount = activeBaseCountOf(withInfluence);
      const next = {
        ...withInfluence,
        chargeAttackIndex: withInfluence.charging
          ? Math.max(0, Math.min(baseCount - 1, withInfluence.chargeAttackIndex))
          : withInfluence.chargeAttackIndex,
      };
      return {
        ...next,
        attackPlan: clampPlan(next, state.attackPlan),
      };
    }
    case 'charging': {
      const withCharging = { ...state, charging: action.value };
      const baseCount = activeBaseCountOf(withCharging);
      const next = {
        ...withCharging,
        chargeAttackIndex: action.value
          ? Math.max(0, Math.min(baseCount - 1, withCharging.chargeAttackIndex))
          : withCharging.chargeAttackIndex,
      };
      return {
        ...next,
        attackPlan: clampPlan(next, state.attackPlan),
      };
    }
    case 'chargeAttackIndex': {
      const baseCount = activeBaseCountOf(state);
      const chargeAttackIndex = Math.max(
        0,
        Math.min(baseCount - 1, action.value),
      );
      const next = { ...state, chargeAttackIndex };
      return {
        ...next,
        attackPlan: clampPlan(next, state.attackPlan),
      };
    }
    case 'enemyHasCover': {
      const next = { ...state, enemyHasCover: action.value };
      return {
        ...next,
        attackPlan: clampPlan(next, state.attackPlan),
      };
    }
    case 'enemyDefensiveStance': {
      const next = { ...state, enemyDefensiveStance: action.value };
      return {
        ...next,
        attackPlan: clampPlan(next, state.attackPlan),
      };
    }
    case 'startingMomentum':
      return { ...state, startingMomentum: action.value };
    case 'initialTacModifierRaw': {
      const initialTacModifier = Math.max(
        activeAttacker.initialTacModifier.min,
        Math.min(activeAttacker.initialTacModifier.max, action.value),
      );
      const next = { ...state, initialTacModifier };
      return {
        ...next,
        attackPlan: clampPlan(next, state.attackPlan),
      };
    }
    case 'damageMods': {
      const next = { ...state, damageMods: action.value };
      return {
        ...next,
        attackPlan: clampPlan(next, state.attackPlan),
      };
    }
    case 'bonusTime': {
      const { attackIndex, value } = action;
      const activeBaseCount = activeBaseCountOf(state);
      if (value) {
        const pool = momentumPoolBeforeBonusTime(
          state.attackPlan.wrapPicks,
          state.damageMods,
          attackIndex,
          state.startingMomentum,
          state.bonusTimeByAttack,
          activeBaseCount,
        );
        if (pool < 1) return state;
      }
      const nextFlags = [...state.bonusTimeByAttack];
      nextFlags[attackIndex] = value;
      const sanitized = sanitizeBonusTimeFlags(
        state.attackPlan.wrapPicks,
        state.damageMods,
        state.startingMomentum,
        nextFlags,
        activeBaseCount,
      );
      return { ...state, bonusTimeByAttack: sanitized };
    }
    case 'sanitizeBonusTime': {
      const sanitized = sanitizeBonusTimeFlags(
        state.attackPlan.wrapPicks,
        state.damageMods,
        state.startingMomentum,
        state.bonusTimeByAttack,
        activeBaseCountOf(state),
      );
      if (bonusTimeEqual(sanitized, state.bonusTimeByAttack)) return state;
      return { ...state, bonusTimeByAttack: sanitized };
    }
    case 'wrapChoice': {
      const merged = nextPlanAfterWrapChoice(
        state.attackPlan,
        action.attackIndex,
        action.pickIndex,
        action.id,
      );
      if (merged == null) return state;
      return {
        ...state,
        attackPlan: clampPlan(state, merged),
      };
    }
    case 'clearWrapContinuation': {
      const merged = nextPlanAfterClearWrapContinuation(
        state.attackPlan,
        action.attackIndex,
      );
      if (merged == null) return state;
      return {
        ...state,
        attackPlan: clampPlan(state, merged),
      };
    }
    case 'characterPlayPick': {
      const merged = nextPlanAfterCharacterPlayPick(
        state.attackPlan,
        action.attackIndex,
        action.pickIndex,
        action.pick,
        state.damageMods,
        activeBaseCountOf(state),
      );
      if (merged == null) return state;
      return {
        ...state,
        attackPlan: clampPlan(state, merged),
      };
    }
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
