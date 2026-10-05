import { createContext, useContext } from 'react';
import type { MeatGrinderSimulation } from '@/gbMeatGrinder/simulation.types';

export const MeatGrinderSimulationContext =
  createContext<MeatGrinderSimulation | null>(null);

export const useMeatGrinderSimulation = (): MeatGrinderSimulation => {
  const simulation = useContext(MeatGrinderSimulationContext);

  if (simulation == null) {
    throw new Error(
      'useMeatGrinderSimulation must be used within MeatGrinderSimulationContext.Provider',
    );
  }

  return simulation;
};
