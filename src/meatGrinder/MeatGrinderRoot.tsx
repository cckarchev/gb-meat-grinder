import { AttacksPanel } from '@/components/AttacksPanel';
import { EnemyPanel } from '@/components/EnemyPanel';
import { VBoarPanel } from '@/components/VBoarPanel';
import { TargetPanelsRow } from '@/components/TargetPanelsRow';
import { MeatGrinderSimulationContext } from '@/meatGrinder/useMeatGrinderSimulation';
import { useMeatGrinderSimulationState } from '@/meatGrinder/useMeatGrinderSimulationState';

export function MeatGrinderRoot() {
  const value = useMeatGrinderSimulationState();
  return (
    <MeatGrinderSimulationContext.Provider value={value}>
      <TargetPanelsRow>
        <VBoarPanel />
        <EnemyPanel />
      </TargetPanelsRow>
      <AttacksPanel />
    </MeatGrinderSimulationContext.Provider>
  );
}
