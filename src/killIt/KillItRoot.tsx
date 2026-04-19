import { AttacksPanel } from '@/components/AttacksPanel';
import { EnemyPanel } from '@/components/EnemyPanel';
import { VBoarPanel } from '@/components/VBoarPanel';
import { TargetPanelsRow } from '@/components/TargetPanelsRow';
import { KillItSimulationContext } from '@/killIt/useKillItSimulation';
import { useKillItSimulationState } from '@/killIt/useKillItSimulationState';

export function KillItRoot() {
  const value = useKillItSimulationState();
  return (
    <KillItSimulationContext.Provider value={value}>
      <TargetPanelsRow>
        <VBoarPanel />
        <EnemyPanel />
      </TargetPanelsRow>
      <AttacksPanel />
    </KillItSimulationContext.Provider>
  );
}
