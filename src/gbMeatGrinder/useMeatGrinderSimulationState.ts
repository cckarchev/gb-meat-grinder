import { useEffect, useMemo, useReducer } from 'react';
import { deriveSimulation } from '@/core/activation/simulation';
import { ATTACKERS } from '@/data/attackers/registry';
import type { MeatGrinderSimulation } from '@/gbMeatGrinder/meatGrinderSimulation.types';
import { createInitialMeatGrinderState } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/reducer/meatGrinderReducer';
import type { MeatGrinderState } from '@/gbMeatGrinder/reducer/reducer.types';
import { attackerOf } from '@/gbMeatGrinder/reducer/stateSelectors';
import {
  appUrl,
  clearLaunchParams,
  launchEmbedBase,
  launchSharedState,
} from '@/gbMeatGrinder/share/launchUrl';
import { buildShareUrl } from '@/gbMeatGrinder/share/shareUrl';
import { shareParamsOf } from '@/gbMeatGrinder/share/shareWire';
import { pickUiEngineResults } from '@/gbMeatGrinder/uiEngineResults';

/** The shared state the app was opened with, else a random model. */
const createLaunchState = (): MeatGrinderState => {
  return launchSharedState() ?? createInitialMeatGrinderState();
};

export const useMeatGrinderSimulationState = (): MeatGrinderSimulation => {
  const [state, dispatch] = useReducer(
    meatGrinderReducer,
    undefined,
    createLaunchState,
  );

  useEffect(() => {
    clearLaunchParams();
  }, []);

  const attacker = attackerOf(state);

  const derived = useMemo(
    () => deriveSimulation(attacker, state),
    [attacker, state],
  );

  return useMemo(() => {
    const { attackerId, attackPlan, bonusTimeByAttack, ...uiEditableState } =
      state;

    const shareUrl = buildShareUrl(
      shareParamsOf(state),
      appUrl(),
      launchEmbedBase,
    );

    return {
      ...uiEditableState,
      ...pickUiEngineResults(derived),
      attacker,
      availableAttackers: ATTACKERS,
      wrapPicks: attackPlan.wrapPicks,
      characterPlayPicks: attackPlan.characterPlayPicks,
      shareUrl,
      dispatch,
    };
  }, [attacker, state, derived]);
};
