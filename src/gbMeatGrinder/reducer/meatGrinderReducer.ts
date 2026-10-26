/**
 * App state transitions: each action patches the state and keeps the plan
 * legal.
 */

import { crowdingOutRange } from "@/core/activation/crowdingOut";
import { gangingUpRange } from "@/core/activation/gangingUp";
import { clampChargeAttackIndex } from "@/core/attacks/attackStructure";
import {
  nextPlanAfterCharacterPlayPick,
  nextPlanAfterClearWrapContinuation,
  nextPlanAfterWrapChoice,
} from "@/core/plan/planEdits";
import type { PlaybookDamageMods } from "@/core/playbook/playbook.types";
import { clamp, clampToRange } from "@/core/shared/clamp";
import { INFLUENCE_MIN } from "@/core/shared/constants";
import { attackerById } from "@/data/attackers/registry";
import {
  resanitizeBonusTime,
  toggleBonusTime,
} from "@/gbMeatGrinder/reducer/bonusTime";
import { stateForAttacker } from "@/gbMeatGrinder/reducer/meatGrinderInitialState";
import {
  applyPlanEdit,
  withReclampedCharge,
  withReclampedPlan,
} from "@/gbMeatGrinder/reducer/planReclamp";
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from "@/gbMeatGrinder/reducer/reducer.types";
import {
  activeBaseCountOf,
  attackerOf,
} from "@/gbMeatGrinder/reducer/stateSelectors";

/**
 * New damage mods, with ganging up and crowding out pulled back into the ranges
 * the toggled buffs and Assist allow, then the plan re-clamped.
 */
const withDamageMods = (
  state: MeatGrinderState,
  damageMods: PlaybookDamageMods,
): MeatGrinderState => {
  const attacker = attackerOf(state);
  const gangingUp = clampToRange(
    state.gangingUp,
    gangingUpRange(attacker, damageMods),
  );
  const crowdingOut = clampToRange(
    state.crowdingOut,
    crowdingOutRange(attacker, damageMods),
  );

  return withReclampedPlan(state, { damageMods, gangingUp, crowdingOut });
};

/** The actions whose type is one of `T`. */
type ActionOfType<T extends MeatGrinderAction["type"]> = Extract<
  MeatGrinderAction,
  { type: T }
>;

/** A type guard for the actions whose type is listed in `types`. */
const isActionOfType =
  <T extends MeatGrinderAction["type"]>(types: readonly T[]) =>
  (action: MeatGrinderAction): action is ActionOfType<T> =>
    (types as readonly string[]).includes(action.type);

/** Actions that describe the target. */
const ENEMY_ACTION_TYPES = [
  "enemyDef",
  "armor",
  "hp",
  "enemyHasCover",
  "enemyDefensiveStance",
  "enemyKnockedDown",
  "enemySnared",
  "enemyResilience",
] as const;

type EnemyAction = ActionOfType<(typeof ENEMY_ACTION_TYPES)[number]>;

const isEnemyAction = isActionOfType(ENEMY_ACTION_TYPES);

const enemyTransition = (
  state: MeatGrinderState,
  action: EnemyAction,
): MeatGrinderState => {
  switch (action.type) {
    case "enemyDef": {
      return withReclampedPlan(state, { enemyDef: action.value });
    }
    case "armor": {
      return withReclampedPlan(state, { armor: action.value });
    }
    case "hp": {
      return { ...state, hp: action.value };
    }
    case "enemyHasCover": {
      return withReclampedPlan(state, { enemyHasCover: action.value });
    }
    case "enemyDefensiveStance": {
      return withReclampedPlan(state, { enemyDefensiveStance: action.value });
    }
    case "enemyKnockedDown": {
      return withReclampedPlan(state, { enemyKnockedDown: action.value });
    }
    case "enemySnared": {
      return withReclampedPlan(state, { enemySnared: action.value });
    }
    case "enemyResilience": {
      // Resilience only changes which swings are *ignored* downstream; it never
      // alters the editable plan's validity, so no re-clamp is needed.
      return { ...state, enemyResilience: action.value };
    }
    default: {
      const _exhaustive: never = action;

      return _exhaustive;
    }
  }
};

/** Actions that change the damage mods or the ranges they allow. */
const DAMAGE_MOD_ACTION_TYPES = [
  "gangingUp",
  "crowdingOut",
  "toughHide",
  "targetBurning",
  "assistEngaged",
  "guildBuff",
] as const;

type DamageModAction = ActionOfType<(typeof DAMAGE_MOD_ACTION_TYPES)[number]>;

const isDamageModAction = isActionOfType(DAMAGE_MOD_ACTION_TYPES);

const damageModTransition = (
  state: MeatGrinderState,
  action: DamageModAction,
): MeatGrinderState => {
  switch (action.type) {
    case "gangingUp": {
      const range = gangingUpRange(attackerOf(state), state.damageMods);
      const gangingUp = clampToRange(action.value, range);

      return withReclampedPlan(state, { gangingUp });
    }
    case "crowdingOut": {
      const range = crowdingOutRange(attackerOf(state), state.damageMods);
      const crowdingOut = clampToRange(action.value, range);

      return withReclampedPlan(state, { crowdingOut });
    }
    case "toughHide": {
      const damageMods = { ...state.damageMods, toughHide: action.value };

      return withDamageMods(state, damageMods);
    }
    case "targetBurning": {
      const damageMods = { ...state.damageMods, targetBurning: action.value };

      return withDamageMods(state, damageMods);
    }
    case "assistEngaged": {
      const damageMods = { ...state.damageMods, assistEngaged: action.value };

      return withDamageMods(state, damageMods);
    }
    case "guildBuff": {
      const buffs = { ...state.damageMods.buffs, [action.id]: action.value };
      const damageMods = { ...state.damageMods, buffs };

      return withDamageMods(state, damageMods);
    }
    default: {
      const _exhaustive: never = action;

      return _exhaustive;
    }
  }
};

/** Actions that edit the attack plan itself. */
const PLAN_ACTION_TYPES = [
  "bonusTime",
  "wrapChoice",
  "clearWrapContinuation",
  "characterPlayPick",
] as const;

type PlanAction = ActionOfType<(typeof PLAN_ACTION_TYPES)[number]>;

const isPlanAction = isActionOfType(PLAN_ACTION_TYPES);

const planTransition = (
  state: MeatGrinderState,
  action: PlanAction,
): MeatGrinderState => {
  switch (action.type) {
    case "bonusTime": {
      return toggleBonusTime(state, action.attackIndex, action.value);
    }
    case "wrapChoice": {
      const edited = nextPlanAfterWrapChoice(
        state.attackPlan,
        action,
        attackerOf(state),
      );

      return applyPlanEdit(state, edited);
    }
    case "clearWrapContinuation": {
      const edited = nextPlanAfterClearWrapContinuation(
        state.attackPlan,
        action.attackIndex,
        attackerOf(state),
      );

      return applyPlanEdit(state, edited);
    }
    case "characterPlayPick": {
      const edited = nextPlanAfterCharacterPlayPick(state.attackPlan, action, {
        attacker: attackerOf(state),
        damageMods: state.damageMods,
        activeBaseCount: activeBaseCountOf(state),
      });

      return applyPlanEdit(state, edited);
    }
    default: {
      const _exhaustive: never = action;

      return _exhaustive;
    }
  }
};

const transition = (
  state: MeatGrinderState,
  action: MeatGrinderAction,
): MeatGrinderState => {
  if (isEnemyAction(action)) {
    return enemyTransition(state, action);
  }

  if (isDamageModAction(action)) {
    return damageModTransition(state, action);
  }

  if (isPlanAction(action)) {
    return planTransition(state, action);
  }

  switch (action.type) {
    case "reset": {
      // Reset everything to defaults but keep the currently selected model.
      return stateForAttacker(attackerOf(state));
    }
    case "selectAttacker": {
      if (action.id === state.attackerId) {
        return state;
      }

      return stateForAttacker(attackerById(action.id), state);
    }
    case "influence": {
      const influence = clamp(
        action.value,
        INFLUENCE_MIN,
        attackerOf(state).inf,
      );

      return withReclampedCharge(state, { influence });
    }
    case "charging": {
      return withReclampedCharge(state, { charging: action.value });
    }
    case "chargeAttackIndex": {
      const chargeAttackIndex = clampChargeAttackIndex(
        action.value,
        activeBaseCountOf(state),
      );

      return withReclampedPlan(state, { chargeAttackIndex });
    }
    case "startingMomentum": {
      const startingMomentum = clampToRange(
        action.value,
        attackerOf(state).startingMomentum,
      );

      return { ...state, startingMomentum };
    }
    case "activeTrait": {
      const activeTraits = {
        ...state.activeTraits,
        [action.id]: action.value,
      };

      return { ...state, activeTraits };
    }
    default: {
      const _exhaustive: never = action;

      return _exhaustive;
    }
  }
};

/**
 * Every transition ends by dropping Bonus Time spends it left unpaid (less
 * momentum, a momentous line unpicked, fewer bases), so no render ever shows
 * a spend the pool cannot cover.
 */
export const meatGrinderReducer = (
  state: MeatGrinderState,
  action: MeatGrinderAction,
): MeatGrinderState => resanitizeBonusTime(transition(state, action));
