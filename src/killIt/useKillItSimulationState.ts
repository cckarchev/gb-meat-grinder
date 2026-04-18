import type { Dispatch } from 'react';
import { useEffect, useMemo, useReducer } from 'react';
import type { AttackRollContext } from '../core/attackSequence';
import { computeAttackSequence } from '../core/attackSequence';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '../core/playbook';
import {
  createInitialKillItState,
  killItReducer,
  type KillItAction,
} from './killItReducer';

export type KillItSimulation = {
  enemyDef: number;
  armor: number;
  hp: number;
  chargeAttackIndex: number;
  enemyHasCover: boolean;
  enemyDefensiveStance: boolean;
  startingMomentum: number;
  initialTacModifier: number;
  damageMods: PlaybookDamageMods;
  bonusTimeByAttack: boolean[];
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
  attacks: AttackRollContext[];
  /** P(all activation swings hit their selected playbook net), assuming independence. */
  probAllSelectedHits: number;
  dispatch: Dispatch<KillItAction>;
};

export function useKillItSimulationState(): KillItSimulation {
  const [state, dispatch] = useReducer(
    killItReducer,
    undefined,
    createInitialKillItState,
  );

  const { wrapPicks, characterPlayPicks } = state.attackPlan;

  useEffect(() => {
    queueMicrotask(() => {
      dispatch({ type: 'sanitizeBonusTime' });
    });
  }, [wrapPicks, state.damageMods, state.startingMomentum]);

  const { attacks, probAll: probAllSelectedHits } = useMemo(
    () =>
      computeAttackSequence(
        state.enemyDef,
        state.armor,
        wrapPicks,
        characterPlayPicks,
        state.chargeAttackIndex,
        state.enemyHasCover,
        state.enemyDefensiveStance,
        state.damageMods,
        state.bonusTimeByAttack,
        state.initialTacModifier,
      ),
    [
      state.enemyDef,
      state.armor,
      wrapPicks,
      characterPlayPicks,
      state.chargeAttackIndex,
      state.enemyHasCover,
      state.enemyDefensiveStance,
      state.damageMods,
      state.bonusTimeByAttack,
      state.initialTacModifier,
    ],
  );

  return useMemo(
    () => ({
      enemyDef: state.enemyDef,
      armor: state.armor,
      hp: state.hp,
      chargeAttackIndex: state.chargeAttackIndex,
      enemyHasCover: state.enemyHasCover,
      enemyDefensiveStance: state.enemyDefensiveStance,
      startingMomentum: state.startingMomentum,
      initialTacModifier: state.initialTacModifier,
      damageMods: state.damageMods,
      bonusTimeByAttack: state.bonusTimeByAttack,
      wrapPicks,
      characterPlayPicks,
      attacks,
      probAllSelectedHits,
      dispatch,
    }),
    [
      state,
      wrapPicks,
      characterPlayPicks,
      attacks,
      probAllSelectedHits,
      dispatch,
    ],
  );
}
