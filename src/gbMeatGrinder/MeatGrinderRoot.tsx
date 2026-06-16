import styled from 'styled-components';
import { AttacksPanel } from '@/components/AttacksPanel';
import { EnemyPanel } from '@/components/EnemyPanel';
import { AttackerPanel } from '@/components/AttackerPanel';
import { TargetPanelsRow } from '@/components/TargetPanelsRow';
import { ToggleButton } from '@/components/controls';
import { narrowViewport } from '@/styles/breakpoints';
import { MeatGrinderSimulationContext } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { useMeatGrinderSimulationState } from '@/gbMeatGrinder/useMeatGrinderSimulationState';

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;

  ${narrowViewport} {
    margin-bottom: 0.85rem;
    gap: 0.5rem;
  }
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;

  ${narrowViewport} {
    gap: 0.45rem;
  }
`;

const TitleIcon = styled.img`
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;

  ${narrowViewport} {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.02em;

  ${narrowViewport} {
    font-size: 1.25rem;
  }
`;

const ResetButton = styled(ToggleButton)`
  flex-shrink: 0;
  font-size: 0.8rem;
  padding: 0.38rem 0.75rem;
`;

export function MeatGrinderRoot() {
  const value = useMeatGrinderSimulationState();
  return (
    <MeatGrinderSimulationContext.Provider value={value}>
      <Header>
        <TitleGroup>
          <TitleIcon src="/favicon.svg" alt="" aria-hidden="true" />
          <Title>GB Meat Grinder</Title>
        </TitleGroup>
        <ResetButton
          type="button"
          onClick={() => value.dispatch({ type: 'reset' })}
        >
          Reset
        </ResetButton>
      </Header>
      <TargetPanelsRow>
        <AttackerPanel />
        <EnemyPanel />
      </TargetPanelsRow>
      <AttacksPanel />
    </MeatGrinderSimulationContext.Provider>
  );
}
