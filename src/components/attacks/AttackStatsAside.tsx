import styled from 'styled-components';
import { Mono } from '../ui';

const AttackStatsRail = styled.aside`
  flex: 0 0 auto;
  text-align: right;
  padding: 0.5rem 0.15rem 0 0;
  min-width: 2rem;
`;

const AttackStatBlock = styled.div`
  margin-bottom: 0.45rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const AttackStatCaption = styled.span`
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin-bottom: 0.08rem;
`;

const AttackStatMono = styled(Mono)`
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text);
`;

const AttackHpRailBlock = styled.div`
  margin-top: 0.55rem;
  padding-top: 0.55rem;
  border-top: 1px solid var(--border);
`;

const AttackHpValue = styled(Mono)`
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--text);
  letter-spacing: -0.02em;
`;

export function AttackStatsAside({
  tac,
  defMinRoll,
  remainingHpIfHit,
}: {
  tac: number;
  defMinRoll: number;
  remainingHpIfHit: number;
}) {
  return (
    <AttackStatsRail aria-label="Attack roll stats">
      <AttackStatBlock>
        <AttackStatCaption>TAC</AttackStatCaption>
        <AttackStatMono>{tac}</AttackStatMono>
      </AttackStatBlock>
      <AttackStatBlock>
        <AttackStatCaption>DEF</AttackStatCaption>
        <AttackStatMono>{defMinRoll}+</AttackStatMono>
      </AttackStatBlock>
      <AttackHpRailBlock>
        <AttackStatCaption>HP</AttackStatCaption>
        <AttackHpValue>{remainingHpIfHit}</AttackHpValue>
      </AttackHpRailBlock>
    </AttackStatsRail>
  );
}
