import styled from 'styled-components';
import { narrowViewport } from '../../styles/breakpoints';
import { characterPlayAvailabilityForPick } from '../../core/playbook';
import type { AttacksPanelProps, CharacterPlaySlotRef } from './types';

const SelectionSection = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--border);

  ${narrowViewport} {
    margin-top: 0.5rem;
    padding-top: 0.45rem;
  }
`;

const SelectionRow = styled.div`
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

const SelectionBtn = styled.button<{ $active: boolean }>`
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

/** Singled Out / Stagger after a GB or 1GB playbook result. */
export function CharacterPlaySelection({
  slots,
  wrapPicks,
  characterPlayPicks,
  damageMods,
  attackIndex,
  displayIdx,
  onCharacterPlayPickChange,
}: {
  slots: CharacterPlaySlotRef[];
  wrapPicks: AttacksPanelProps['wrapPicks'];
  characterPlayPicks: AttacksPanelProps['characterPlayPicks'];
  damageMods: AttacksPanelProps['damageMods'];
  attackIndex: number;
  displayIdx: number;
  onCharacterPlayPickChange: AttacksPanelProps['onCharacterPlayPickChange'];
}) {
  const i = attackIndex;
  const actionable = slots.filter(({ pickIndex }) => {
    const cpAvail = characterPlayAvailabilityForPick(
      wrapPicks,
      characterPlayPicks,
      i,
      pickIndex,
      damageMods,
    );
    return !cpAvail.depleted && (cpAvail.canPickSo || cpAvail.canPickStagger);
  });
  if (actionable.length === 0) return null;

  return (
    <SelectionSection>
      {actionable.map(({ pickIndex }) => {
        const cpAvail = characterPlayAvailabilityForPick(
          wrapPicks,
          characterPlayPicks,
          i,
          pickIndex,
          damageMods,
        );
        const pick = characterPlayPicks[i]?.[pickIndex];
        const pickOrdinal = pickIndex + 1;
        const attackOrdinal = displayIdx + 1;
        const soLabel = `Singled Out for attack ${attackOrdinal}, character play ${pickOrdinal}`;
        const stLabel = `Stagger for attack ${attackOrdinal}, character play ${pickOrdinal}`;

        return (
          <SelectionRow key={pickIndex}>
            {cpAvail.canPickSo ? (
              <SelectionBtn
                type="button"
                $active={pick === 'so'}
                aria-label={soLabel}
                onClick={() => onCharacterPlayPickChange(i, pickIndex, 'so')}
              >
                Singled Out
              </SelectionBtn>
            ) : null}
            {cpAvail.canPickStagger ? (
              <SelectionBtn
                type="button"
                $active={pick === 'stagger'}
                aria-label={stLabel}
                onClick={() =>
                  onCharacterPlayPickChange(i, pickIndex, 'stagger')
                }
              >
                Stagger
              </SelectionBtn>
            ) : null}
          </SelectionRow>
        );
      })}
    </SelectionSection>
  );
}
