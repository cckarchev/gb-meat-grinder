import { AttacksPanel } from '../components/AttacksPanel';
import { EnemyPanel } from '../components/EnemyPanel';
import { VBoarPanel } from '../components/VBoarPanel';
import { TargetPanelsRow } from '../components/TargetPanelsRow';
import { KillItSimulationContext } from './useKillItSimulation';
import { useKillItSimulationState } from './useKillItSimulationState';

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
