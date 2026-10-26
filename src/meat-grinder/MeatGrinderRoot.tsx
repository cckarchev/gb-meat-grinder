import { AttackerPanel } from "@/meat-grinder/attacker-panel/AttackerPanel";
import { AttacksPanel } from "@/meat-grinder/attacks-panel/AttacksPanel";
import { EnemyPanel } from "@/meat-grinder/enemy-panel/EnemyPanel";
import { ShareButton } from "@/meat-grinder/share-button/ShareButton";
import { ToggleButton } from "@/ui/toggle-button/ToggleButton";
import styles from "./MeatGrinderRoot.module.css";
import { SetupPanelsRow } from "./SetupPanelsRow";
import { MeatGrinderSimulationContext } from "./useMeatGrinderSimulation";
import { useMeatGrinderSimulationState } from "./useMeatGrinderSimulationState";

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
        <div className={styles.headerActions}>
          <ShareButton
            className={styles.headerButton}
            url={simulation.shareUrl}
          />
          <ToggleButton
            className={styles.resetButton}
            type="button"
            onClick={() => simulation.dispatch({ type: "reset" })}
          >
            Reset
          </ToggleButton>
        </div>
      </header>
      <SetupPanelsRow>
        <AttackerPanel />
        <EnemyPanel />
      </SetupPanelsRow>
      <AttacksPanel />
    </MeatGrinderSimulationContext.Provider>
  );
};
