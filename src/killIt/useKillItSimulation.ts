import { createContext, useContext } from 'react';
import type { KillItSimulation } from '@/types/killIt/simulation';

export const KillItSimulationContext = createContext<KillItSimulation | null>(
  null,
);

export function useKillItSimulation(): KillItSimulation {
  const ctx = useContext(KillItSimulationContext);
  if (ctx == null) {
    throw new Error(
      'useKillItSimulation must be used within KillItSimulationContext.Provider',
    );
  }
  return ctx;
}
