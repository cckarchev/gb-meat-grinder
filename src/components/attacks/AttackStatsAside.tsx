import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';
import { Mono } from '@/components/ui';

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
  font-family: var(--font-mono);
  font-size: 0.64em;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label);
  color: var(--muted);

  ${narrowViewport} {
    letter-spacing: 0.08em;
  }
`;

const AttackStatMono = styled(Mono)`
  font-size: 0.92em;
  font-weight: 600;
  color: var(--text);
`;

export function AttackStatsAside({
  defMinRoll,
  armor,
  momentum,
  remainingHpIfHit,
}: {
  defMinRoll: number;
  armor: number;
  momentum: number;
  remainingHpIfHit: number;
}) {
  return (
    <AttackStatsRail aria-label="Defense, armor, momentum, and HP after this swing">
      <StatRow>
        <AttackStatCaption>DEF</AttackStatCaption>
        <AttackStatMono>{defMinRoll}+</AttackStatMono>
      </StatRow>
      <StatRow>
        <AttackStatCaption>ARM</AttackStatCaption>
        <AttackStatMono>{armor}</AttackStatMono>
      </StatRow>
      <StatRow>
        <AttackStatCaption>HP</AttackStatCaption>
        <AttackStatMono>{remainingHpIfHit}</AttackStatMono>
      </StatRow>
      <StatRow>
        <AttackStatCaption>Mom</AttackStatCaption>
        <AttackStatMono>{momentum}</AttackStatMono>
      </StatRow>
    </AttackStatsRail>
  );
}
