import { crowdingOutRange } from '@/core/activation/crowdingOut';
import { gangingUpRange } from '@/core/activation/gangingUp';
/** App state transitions: each action patches the state and keeps the plan legal. */

import { clampChargeAttackIndex } from '@/core/attacks/attackStructure';
import {
  nextPlanAfterCharacterPlayPick,
  nextPlanAfterClearWrapContinuation,
  nextPlanAfterWrapChoice,
} from '@/core/plan/planEdits';
import { clamp, clampToRange } from '@/core/shared/clamp';
import { INFLUENCE_MIN } from '@/core/shared/constants';
import { attackerById } from '@/data/attackers/registry';
import {
  resanitizeBonusTime,
  toggleBonusTime,
} from '@/gbMeatGrinder/reducer/bonusTime';
import { stateForAttacker } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import {
  applyPlanEdit,
  withReclampedCharge,
  withReclampedPlan,
} from '@/gbMeatGrinder/reducer/planReclamp';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';
import {
  activeBaseCountOf,
  attackerOf,
} from '@/gbMeatGrinder/reducer/stateSelectors';

const transition = (
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
      const influence = clamp(
        action.value,
        INFLUENCE_MIN,
        attackerOf(state).inf,
      );

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
      const startingMomentum = clampToRange(
        action.value,
        attackerOf(state).startingMomentum,
      );

      return { ...state, startingMomentum };
    }
    case 'gangingUp': {
      const range = gangingUpRange(attackerOf(state), state.damageMods);
      const gangingUp = clampToRange(action.value, range);

      return withReclampedPlan(state, { gangingUp });
    }
    case 'crowdingOut': {
      const range = crowdingOutRange(attackerOf(state), state.damageMods);
      const crowdingOut = clampToRange(action.value, range);

      return withReclampedPlan(state, { crowdingOut });
    }
    case 'toughHide': {
      const damageMods = { ...state.damageMods, toughHide: action.value };

      return withReclampedPlan(state, { damageMods });
    }
    case 'targetBurning': {
      const damageMods = { ...state.damageMods, targetBurning: action.value };

      return withReclampedPlan(state, { damageMods });
    }
    case 'assistEngaged': {
      const damageMods = { ...state.damageMods, assistEngaged: action.value };
      const range = gangingUpRange(attackerOf(state), damageMods);
      const gangingUp = clampToRange(state.gangingUp, range);

      return withReclampedPlan(state, { damageMods, gangingUp });
    }
    case 'guildBuff': {
      const buffs = { ...state.damageMods.buffs, [action.id]: action.value };
      const damageMods = { ...state.damageMods, buffs };
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
    }
    case 'activeTrait': {
      const activeTraits = {
        ...state.activeTraits,
        [action.id]: action.value,
      };

      return { ...state, activeTraits };
    }
    case 'bonusTime': {
      return toggleBonusTime(state, action.attackIndex, action.value);
    }
    case 'wrapChoice': {
      const edited = nextPlanAfterWrapChoice(
        state.attackPlan,
        action,
        attackerOf(state),
      );

      return applyPlanEdit(state, edited);
    }
    case 'clearWrapContinuation': {
      const edited = nextPlanAfterClearWrapContinuation(
        state.attackPlan,
        action.attackIndex,
        attackerOf(state),
      );

      return applyPlanEdit(state, edited);
    }
    case 'characterPlayPick': {
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

/**
 * Every transition ends by dropping Bonus Time spends it left unpaid (less
 * momentum, a momentous line unpicked, fewer bases), so no render ever shows
 * a spend the pool cannot cover.
 */
export const meatGrinderReducer = (
  state: MeatGrinderState,
  action: MeatGrinderAction,
): MeatGrinderState => {
  return resanitizeBonusTime(transition(state, action));
};
