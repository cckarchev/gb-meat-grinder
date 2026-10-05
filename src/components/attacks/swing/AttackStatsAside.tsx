import styled from 'styled-components';
import { Mono } from '@/components/ui/ui';
import { narrowViewport } from '@/styles/breakpoints';
import { monoCapsLabel } from '@/styles/mixins';

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

/** Sized in `em` so it scales with the rail's narrow-viewport font size. */
const AttackStatCaption = styled.span`
  ${monoCapsLabel}
  flex-shrink: 0;
  font-size: 0.64em;

  ${narrowViewport} {
    letter-spacing: 0.08em;
  }
`;

const AttackStatMono = styled(Mono)`
  font-size: 0.92em;
  font-weight: 600;
  color: var(--text);
`;

type AttackStatsAsideProps = {
  defMinRoll: number;
  armor: number;
  momentum: number;
  remainingHpIfHit: number;
};

export const AttackStatsAside = ({
  defMinRoll,
  armor,
  momentum,
  remainingHpIfHit,
}: AttackStatsAsideProps) => {
  return (
    <AttackStatsRail aria-label="Defense, armor, HP after this swing, and momentum">
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
};
