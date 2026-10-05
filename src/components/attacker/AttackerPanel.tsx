import styled from 'styled-components';
import { AttackerModelSelect } from '@/components/attacker/AttackerModelSelect';
import { AttackerPreAttackOptions } from '@/components/attacker/AttackerPreAttackOptions';
import { StepControl } from '@/components/ui/StepControl';
import { Panel, PanelTitle } from '@/components/ui/ui';
import { INFLUENCE_MIN } from '@/core/shared/constants';
import { formatSigned } from '@/core/shared/format';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';

/**
 * Model spans the full width on its own row; the paired steppers (Influence /
 * Starting momentum, then Ganging Up / Crowding Out) line up in two columns
 * instead of flex-wrapping unaligned.
 */
const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  align-items: start;

  ${narrowViewport} {
    gap: 0.55rem;
  }

  ${extraNarrowViewport} {
    grid-template-columns: 1fr;
  }
`;

/** Visual break before the pre-attack toggles; no heading, just a rule. */
const PreAttackSection = styled.div`
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border);

  ${narrowViewport} {
    margin-top: 0.65rem;
    padding-top: 0.6rem;
  }
`;

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
      <ControlsGrid>
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
      </ControlsGrid>
      <PreAttackSection>
        <AttackerPreAttackOptions />
      </PreAttackSection>
    </Panel>
  );
};
