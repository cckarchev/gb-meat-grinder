import { createContext, useContext } from 'react';
import type { MeatGrinderSimulation } from '@/types/gbMeatGrinder/simulation';

export const MeatGrinderSimulationContext =
  createContext<MeatGrinderSimulation | null>(null);

export function useMeatGrinderSimulation(): MeatGrinderSimulation {
  const ctx = useContext(MeatGrinderSimulationContext);
  if (ctx == null) {
    throw new Error(
      'useMeatGrinderSimulation must be used within MeatGrinderSimulationContext.Provider',
    );
  }
  return ctx;
}
