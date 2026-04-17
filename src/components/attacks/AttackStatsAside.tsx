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

const AttackStatBlock = styled.div`
  margin-bottom: 0.45rem;

  &:last-of-type {
    margin-bottom: 0;
  }

  ${narrowViewport} {
    margin-bottom: 0.3rem;
  }
`;

const AttackStatCaption = styled.span`
  display: block;
  font-size: 0.68em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin-bottom: 0.08rem;

  ${narrowViewport} {
    letter-spacing: 0.03em;
  }
`;

const AttackStatMono = styled(Mono)`
  font-size: 0.92em;
  font-weight: 600;
  color: var(--text);
`;

const AttackHpRailBlock = styled.div`
  margin-top: 0.55rem;
  padding-top: 0.55rem;
  border-top: 1px solid var(--border);

  ${narrowViewport} {
    margin-top: 0.4rem;
    padding-top: 0.4rem;
  }
`;

const AttackHpValue = styled(Mono)`
  font-size: 1.2em;
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
