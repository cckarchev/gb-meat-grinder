import styled from 'styled-components';
import { narrowViewport } from '../../styles/breakpoints';
import { gbFollowUpAvailabilityForPick } from '../../core/playbook';
import type { AttacksPanelProps, GbSlotRef } from './types';

const CharacterPlaySection = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--border);

  ${narrowViewport} {
    margin-top: 0.5rem;
    padding-top: 0.45rem;
  }
`;

const CharacterPlayRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem 0.65rem;
  margin-top: 0.5rem;

  &:first-of-type {
    margin-top: 0.35rem;
  }

  ${narrowViewport} {
    gap: 0.35rem 0.4rem;
    margin-top: 0.35rem;

    &:first-of-type {
      margin-top: 0.25rem;
    }
  }
`;

const CpBtn = styled.button<{ $active: boolean }>`
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  min-width: 8.5rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  cursor: pointer;
  white-space: nowrap;
  background: ${(p) => (p.$active ? 'var(--text)' : 'var(--input-bg)')};
  color: ${(p) => (p.$active ? 'var(--bg)' : 'var(--text)')};

  &:hover {
    filter: brightness(1.05);
  }

  ${narrowViewport} {
    font-size: 0.8rem;
    padding: 0.38rem 0.55rem;
    min-width: 6.75rem;
    border-radius: 5px;
  }
`;

export function GbFollowUpSection({
  slots,
  wrapPicks,
  gbFollowUps,
  attackIndex,
  displayIdx,
  onGbFollowUpChange,
}: {
  slots: GbSlotRef[];
  wrapPicks: AttacksPanelProps['wrapPicks'];
  gbFollowUps: AttacksPanelProps['gbFollowUps'];
  attackIndex: number;
  displayIdx: number;
  onGbFollowUpChange: AttacksPanelProps['onGbFollowUpChange'];
}) {
  const i = attackIndex;
  const actionable = slots.filter(({ pickIndex }) => {
    const gbAvail = gbFollowUpAvailabilityForPick(
      wrapPicks,
      gbFollowUps,
      i,
      pickIndex,
    );
    return !gbAvail.depleted && (gbAvail.canPickSo || gbAvail.canPickStagger);
  });
  if (actionable.length === 0) return null;

  return (
    <CharacterPlaySection>
      {actionable.map(({ pickIndex }) => {
        const gbAvail = gbFollowUpAvailabilityForPick(
          wrapPicks,
          gbFollowUps,
          i,
          pickIndex,
        );
        const follow = gbFollowUps[i]?.[pickIndex];
        const pickOrdinal = pickIndex + 1;
        const attackOrdinal = displayIdx + 1;
        const soLabel = `Singled Out for attack ${attackOrdinal}, GB result ${pickOrdinal}`;
        const stLabel = `Stagger for attack ${attackOrdinal}, GB result ${pickOrdinal}`;

        return (
          <CharacterPlayRow key={pickIndex}>
            {gbAvail.canPickSo ? (
              <CpBtn
                type="button"
                $active={follow === 'so'}
                aria-label={soLabel}
                onClick={() => onGbFollowUpChange(i, pickIndex, 'so')}
              >
                Singled Out
              </CpBtn>
            ) : null}
            {gbAvail.canPickStagger ? (
              <CpBtn
                type="button"
                $active={follow === 'stagger'}
                aria-label={stLabel}
                onClick={() => onGbFollowUpChange(i, pickIndex, 'stagger')}
              >
                Stagger
              </CpBtn>
            ) : null}
          </CharacterPlayRow>
        );
      })}
    </CharacterPlaySection>
  );
}
