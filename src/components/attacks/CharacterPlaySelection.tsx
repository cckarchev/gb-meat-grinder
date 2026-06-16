import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';
import { characterPlayAvailabilityForPick } from '@/core/playbook';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { ToggleButton } from '@/components/controls';
import type {
  AttacksPanelProps,
  CharacterPlaySlotRef,
} from '@/types/components/attacks';

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

const SelectionBtn = styled(ToggleButton)`
  min-width: 8.5rem;

  ${narrowViewport} {
    min-width: 6.75rem;
  }
`;

/** Character-play options offered after a GB / 1GB playbook result. */
export function CharacterPlaySelection({
  slots,
  wrapPicks,
  characterPlayPicks,
  damageMods,
  attackIndex,
  displayIdx,
  activeBaseCount,
  onCharacterPlayPickChange,
}: {
  slots: CharacterPlaySlotRef[];
  wrapPicks: AttacksPanelProps['wrapPicks'];
  characterPlayPicks: AttacksPanelProps['characterPlayPicks'];
  damageMods: AttacksPanelProps['damageMods'];
  attackIndex: number;
  displayIdx: number;
  activeBaseCount: number;
  onCharacterPlayPickChange: AttacksPanelProps['onCharacterPlayPickChange'];
}) {
  const { attacker } = useMeatGrinderSimulation();
  const i = attackIndex;
  const actionable = slots.filter(({ pickIndex }) => {
    const cpAvail = characterPlayAvailabilityForPick(
      attacker,
      wrapPicks,
      characterPlayPicks,
      i,
      pickIndex,
      damageMods,
      activeBaseCount,
    );
    return !cpAvail.depleted;
  });
  if (actionable.length === 0) return null;

  return (
    <>
      {actionable.map(({ pickIndex }) => {
        const { available } = characterPlayAvailabilityForPick(
          attacker,
          wrapPicks,
          characterPlayPicks,
          i,
          pickIndex,
          damageMods,
          activeBaseCount,
        );
        const pick = characterPlayPicks[i]?.[pickIndex];
        const pickOrdinal = pickIndex + 1;
        const attackOrdinal = displayIdx + 1;

        return (
          <SelectionRow key={pickIndex}>
            {available.map((cp) => (
              <SelectionBtn
                key={cp.id}
                type="button"
                $active={pick === cp.id}
                aria-label={`${cp.label} for attack ${attackOrdinal}, character play ${pickOrdinal}`}
                onClick={() => onCharacterPlayPickChange(i, pickIndex, cp.id)}
              >
                {cp.label}
              </SelectionBtn>
            ))}
          </SelectionRow>
        );
      })}
    </>
  );
}
