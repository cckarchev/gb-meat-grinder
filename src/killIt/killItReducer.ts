import {
  BASE_ATTACK_COUNT,
  HP_DEFAULT,
  INITIAL_TAC_MODIFIER_MAX,
  INITIAL_TAC_MODIFIER_MIN,
  MAX_ATTACK_COUNT,
} from '../core/constants';
import {
  clampAttackPlanState,
  createInitialAttackPlan,
  nextPlanAfterCharacterPlayPick,
  nextPlanAfterClearWrapContinuation,
  nextPlanAfterWrapChoice,
  type AttackPlan,
  type AttackPlanClampParams,
} from '../core/attackPlanState';
import {
  DEFAULT_PLAYBOOK_DAMAGE_MODS,
  momentumPoolBeforeBonusTime,
  sanitizeBonusTimeFlags,
  type CharacterPlayPick,
  type PlaybookChoiceId,
  type PlaybookDamageMods,
} from '../core/playbook';

export type KillItState = {
  enemyDef: number;
  armor: number;
  hp: number;
  chargeAttackIndex: number;
  enemyHasCover: boolean;
  startingMomentum: number;
  initialTacModifier: number;
  bonusTimeByAttack: boolean[];
  damageMods: PlaybookDamageMods;
  attackPlan: AttackPlan;
};

function clampParams(s: KillItState): AttackPlanClampParams {
  return {
    chargeAttackIndex: s.chargeAttackIndex,
    armor: s.armor,
    enemyHasCover: s.enemyHasCover,
    damageMods: s.damageMods,
    enemyDef: s.enemyDef,
    bonusTimeByAttack: s.bonusTimeByAttack,
    initialTacModifier: s.initialTacModifier,
  };
}

function clampPlan(s: KillItState, plan: AttackPlan): AttackPlan {
  return clampAttackPlanState(plan, clampParams(s));
}

function bonusTimeEqual(
  a: readonly boolean[],
  b: readonly boolean[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export type KillItAction =
  | { type: 'enemyDef'; value: number }
  | { type: 'armor'; value: number }
  | { type: 'hp'; value: number }
  | { type: 'chargeAttackIndex'; value: number }
  | { type: 'enemyHasCover'; value: boolean }
  | { type: 'startingMomentum'; value: number }
  | { type: 'initialTacModifierRaw'; value: number }
  | { type: 'damageMods'; value: PlaybookDamageMods }
  | { type: 'bonusTime'; attackIndex: number; value: boolean }
  | { type: 'sanitizeBonusTime' }
  | {
      type: 'wrapChoice';
      attackIndex: number;
      pickIndex: number;
      id: PlaybookChoiceId | null;
    }
  | { type: 'clearWrapContinuation'; attackIndex: number }
  | {
      type: 'characterPlayPick';
      attackIndex: number;
      pickIndex: number;
      pick: CharacterPlayPick;
    };

export function createInitialKillItState(): KillItState {
  return {
    enemyDef: 4,
    armor: 1,
    hp: HP_DEFAULT,
    chargeAttackIndex: 0,
    enemyHasCover: false,
    startingMomentum: 0,
    initialTacModifier: 0,
    bonusTimeByAttack: Array.from({ length: MAX_ATTACK_COUNT }, () => false),
    damageMods: DEFAULT_PLAYBOOK_DAMAGE_MODS,
    attackPlan: createInitialAttackPlan(),
  };
}

export function killItReducer(state: KillItState, action: KillItAction): KillItState {
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
    case 'chargeAttackIndex': {
      const chargeAttackIndex = Math.max(
        0,
        Math.min(BASE_ATTACK_COUNT - 1, action.value),
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
    case 'startingMomentum':
      return { ...state, startingMomentum: action.value };
    case 'initialTacModifierRaw': {
      const initialTacModifier = Math.max(
        INITIAL_TAC_MODIFIER_MIN,
        Math.min(INITIAL_TAC_MODIFIER_MAX, action.value),
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
      if (value) {
        const pool = momentumPoolBeforeBonusTime(
          state.attackPlan.wrapPicks,
          state.damageMods,
          attackIndex,
          state.startingMomentum,
          state.bonusTimeByAttack,
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
      );
      return { ...state, bonusTimeByAttack: sanitized };
    }
    case 'sanitizeBonusTime': {
      const sanitized = sanitizeBonusTimeFlags(
        state.attackPlan.wrapPicks,
        state.damageMods,
        state.startingMomentum,
        state.bonusTimeByAttack,
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
