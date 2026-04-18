import { createContext, useContext } from 'react';
import type { KillItSimulation } from './useKillItSimulationState';

export const KillItSimulationContext = createContext<KillItSimulation | null>(
  null,
);

export type { KillItSimulation } from './useKillItSimulationState';

export function useKillItSimulation(): KillItSimulation {
  const ctx = useContext(KillItSimulationContext);
  if (ctx == null) {
    throw new Error(
      'useKillItSimulation must be used within KillItSimulationContext.Provider',
    );
  }
  return ctx;
}
