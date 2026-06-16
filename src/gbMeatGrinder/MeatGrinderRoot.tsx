import { AttacksPanel } from '@/components/AttacksPanel';
import { EnemyPanel } from '@/components/EnemyPanel';
import { AttackerPanel } from '@/components/AttackerPanel';
import { TargetPanelsRow } from '@/components/TargetPanelsRow';
import { MeatGrinderSimulationContext } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { useMeatGrinderSimulationState } from '@/gbMeatGrinder/useMeatGrinderSimulationState';

export function MeatGrinderRoot() {
  const value = useMeatGrinderSimulationState();
  return (
    <MeatGrinderSimulationContext.Provider value={value}>
      <TargetPanelsRow>
        <AttackerPanel />
        <EnemyPanel />
      </TargetPanelsRow>
      <AttacksPanel />
    </MeatGrinderSimulationContext.Provider>
  );
}
