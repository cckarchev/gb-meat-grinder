import { AttackerModelSelect } from '@/components/attacker/AttackerModelSelect';
import styles from '@/components/attacker/AttackerPanel.module.css';
import { AttackerPreAttackOptions } from '@/components/attacker/AttackerPreAttackOptions';
import { StepControl } from '@/components/ui/StepControl';
import { Panel, PanelFooterSection, PanelTitle } from '@/components/ui/ui';
import { INFLUENCE_MIN } from '@/core/shared/constants';
import { formatSigned } from '@/core/shared/format';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

export const AttackerPanel = () => {
  const {
    attacker,
    startingMomentum,
    gangingUp,
    crowdingOut,
    influence,
    dispatch,
  } = useMeatGrinderSimulation();

  const gangingUpLabel = formatSigned(gangingUp);
  const crowdingOutLabel = formatSigned(-crowdingOut);

  return (
    <Panel>
      <PanelTitle>Attacker</PanelTitle>
      <div className={styles.controlsGrid}>
        <AttackerModelSelect />
        <StepControl
          label="Influence"
          value={influence}
          min={INFLUENCE_MIN}
          max={attacker.inf}
          onChange={(value) => dispatch({ type: 'influence', value })}
          ariaSubject="influence"
        />
        <StepControl
          label="Starting momentum"
          value={startingMomentum}
          min={attacker.startingMomentum.min}
          max={attacker.startingMomentum.max}
          onChange={(value) => dispatch({ type: 'startingMomentum', value })}
          ariaSubject="starting momentum"
        />
        <StepControl
          label="Ganging Up"
          value={gangingUp}
          min={attacker.gangingUp.min}
          max={attacker.gangingUp.max}
          onChange={(value) => dispatch({ type: 'gangingUp', value })}
          valueLabel={gangingUpLabel}
          ariaSubject="Ganging Up"
        />
        <StepControl
          label="Crowding Out"
          value={crowdingOut}
          min={attacker.crowdingOut.min}
          max={attacker.crowdingOut.max}
          onChange={(value) => dispatch({ type: 'crowdingOut', value })}
          valueLabel={crowdingOutLabel}
          ariaSubject="Crowding Out"
        />
      </div>
      <PanelFooterSection className={styles.preAttackSection}>
        <AttackerPreAttackOptions />
      </PanelFooterSection>
    </Panel>
  );
};
