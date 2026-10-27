import { useEffect, useMemo, useReducer } from "react";
import { deriveSimulation } from "@/core/activation/simulation";
import { ATTACKERS } from "@/data/attackers/registry";
import type { MeatGrinderSimulation } from "./meatGrinderSimulation.types";
import { createInitialMeatGrinderState } from "./reducer/meatGrinderInitialState";
import { meatGrinderReducer } from "./reducer/meatGrinderReducer";
import type { MeatGrinderState } from "./reducer/reducer.types";
import { attackerOf } from "./reducer/stateSelectors";
import {
  appUrl,
  clearLaunchParams,
  launchSharedState,
} from "./share/launchUrl";
import { buildShareUrl } from "./share/shareUrl";
import { shareParamsOf } from "./share/shareWire";
import { pickUiEngineResults } from "./uiEngineResults";

/** The shared state the app was opened with, else a random model. */
const createLaunchState = (): MeatGrinderState =>
  launchSharedState() ?? createInitialMeatGrinderState();

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

    const shareUrl = buildShareUrl(shareParamsOf(state), appUrl());

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
