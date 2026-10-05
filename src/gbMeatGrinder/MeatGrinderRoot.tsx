import { AttackerPanel } from '@/components/attacker/AttackerPanel';
import { AttacksPanel } from '@/components/attacks/AttacksPanel';
import { EnemyPanel } from '@/components/enemy/EnemyPanel';
import { SetupPanelsRow } from '@/components/ui/SetupPanelsRow';
import { ToggleButton } from '@/components/ui/ToggleButton';
import styles from '@/gbMeatGrinder/MeatGrinderRoot.module.css';
import { MeatGrinderSimulationContext } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { useMeatGrinderSimulationState } from '@/gbMeatGrinder/useMeatGrinderSimulationState';

export const MeatGrinderRoot = () => {
  const simulation = useMeatGrinderSimulationState();

  return (
    <MeatGrinderSimulationContext.Provider value={simulation}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <img
            className={styles.titleIcon}
            src="/favicon.svg"
            alt=""
            aria-hidden="true"
          />
          <h1 className={styles.title}>GB Meat Grinder</h1>
        </div>
        <ToggleButton
          className={styles.resetButton}
          type="button"
          onClick={() => simulation.dispatch({ type: 'reset' })}
        >
          Reset
        </ToggleButton>
      </header>
      <SetupPanelsRow>
        <AttackerPanel />
        <EnemyPanel />
      </SetupPanelsRow>
      <AttacksPanel />
    </MeatGrinderSimulationContext.Provider>
  );
};
