import styled from 'styled-components';
import { narrowViewport } from '../../styles/breakpoints';
import { Mono } from '../ui';

const AttackStatsRail = styled.aside`
  flex: 0 0 auto;
  text-align: right;
  padding: 0.5rem 0.15rem 0 0;
  min-width: 2rem;
  font-size: 1rem;

  ${narrowViewport} {
    padding: 0.35rem 0.05rem 0 0;
    font-size: 0.8rem;
  }
`;

const StatRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: flex-end;
  gap: 0.35rem;
  margin-bottom: 0.45rem;

  &:last-of-type {
    margin-bottom: 0;
  }

  ${narrowViewport} {
    gap: 0.28rem;
    margin-bottom: 0.3rem;
  }
`;

const AttackStatCaption = styled.span`
  flex-shrink: 0;
  font-size: 0.68em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);

  ${narrowViewport} {
    letter-spacing: 0.03em;
  }
`;

const AttackStatMono = styled(Mono)`
  font-size: 0.92em;
  font-weight: 600;
  color: var(--text);
`;

export function AttackStatsAside({
  defMinRoll,
  momentum,
  remainingHpIfHit,
}: {
  defMinRoll: number;
  momentum: number;
  remainingHpIfHit: number;
}) {
  return (
    <AttackStatsRail aria-label="Defense, momentum, and HP after this swing">
      <StatRow>
        <AttackStatCaption>DEF</AttackStatCaption>
        <AttackStatMono>{defMinRoll}+</AttackStatMono>
      </StatRow>
      <StatRow>
        <AttackStatCaption>Mom</AttackStatCaption>
        <AttackStatMono>{momentum}</AttackStatMono>
      </StatRow>
      <StatRow>
        <AttackStatCaption>HP</AttackStatCaption>
        <AttackStatMono>{remainingHpIfHit}</AttackStatMono>
      </StatRow>
    </AttackStatsRail>
  );
}
