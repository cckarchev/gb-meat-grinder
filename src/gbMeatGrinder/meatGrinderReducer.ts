import { attackerById, DEFAULT_ATTACKER } from '@/attackers/registry';
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
  momentumPoolBeforeBonusTime,
  sanitizeBonusTimeFlags,
} from '@/core/playbook';
import type { AttackerData } from '@/types/core/attacker';
import type {
  AttackPlan,
  AttackPlanClampParams,
} from '@/types/core/attackPlan';
import type { MeatGrinderAction, MeatGrinderState } from '@/types/gbMeatGrinder/reducer';

function attackerOf(s: MeatGrinderState): AttackerData {
  return attackerById(s.attackerId);
}

/** Active base attacks for the current influence / charge choice. */
function activeBaseCountOf(s: MeatGrinderState): number {
  return activeBaseAttackCount(attackerOf(s), s.influence, s.charging);
}

/** Charge row the engine should use: the chosen base, or -1 when not charging. */
function effectiveChargeIndex(s: MeatGrinderState): number {
  return s.charging ? s.chargeAttackIndex : -1;
}

function clampParams(s: MeatGrinderState): AttackPlanClampParams {
  return {
    attacker: attackerOf(s),
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Fresh attacker-side state for a model, preserving enemy stats from `prev`. */
function stateForAttacker(
  attacker: AttackerData,
  prev?: Partial<MeatGrinderState>,
): MeatGrinderState {
  const influence = clamp(prev?.influence ?? attacker.inf, 0, attacker.inf);
  const charging = prev?.charging ?? false;
  return {
    attackerId: attacker.id,
    enemyDef: prev?.enemyDef ?? 4,
    armor: prev?.armor ?? 1,
    hp: prev?.hp ?? HP_DEFAULT,
    influence,
    charging,
    chargeAttackIndex: 0,
    enemyHasCover: prev?.enemyHasCover ?? false,
    enemyDefensiveStance: prev?.enemyDefensiveStance ?? false,
    startingMomentum: clamp(
      prev?.startingMomentum ?? 0,
      attacker.startingMomentum.min,
      attacker.startingMomentum.max,
    ),
    initialTacModifier: clamp(
      prev?.initialTacModifier ?? 0,
      attacker.initialTacModifier.min,
      attacker.initialTacModifier.max,
    ),
    bonusTimeByAttack: Array.from(
      { length: attackArraySize(attacker) },
      () => false,
    ),
    damageMods: { toughHide: prev?.damageMods?.toughHide ?? false, buffs: {} },
    attackPlan: createInitialAttackPlan(attacker, influence, charging),
  };
}

export function createInitialMeatGrinderState(): MeatGrinderState {
  return stateForAttacker(DEFAULT_ATTACKER);
}

export function meatGrinderReducer(
  state: MeatGrinderState,
  action: MeatGrinderAction,
): MeatGrinderState {
  switch (action.type) {
    case 'selectAttacker': {
      if (action.id === state.attackerId) return state;
      const attacker = attackerById(action.id);
      return stateForAttacker(attacker, state);
    }
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
      const influence = clamp(action.value, 0, attackerOf(state).inf);
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
      const tacRange = attackerOf(state).initialTacModifier;
      const initialTacModifier = clamp(
        action.value,
        tacRange.min,
        tacRange.max,
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
          attackerOf(state),
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
        attackerOf(state),
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
        attackerOf(state),
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
        attackerOf(state),
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
        attackerOf(state),
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
        attackerOf(state),
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
