import type { CharacterPlaySlotRef } from '@/components/attacks/attacks.types';
import {
  Pills,
  Section,
  SectionHeading,
  SlotRow,
  SlotTag,
} from '@/components/attacks/plays/characterPlayStyles';
import { PlayPill } from '@/components/attacks/plays/PlayPill';
import {
  characterPlayEffectSummary,
  characterPlayHasEffect,
} from '@/core/characterPlays/characterPlayEffects';
import { characterPlayAvailabilityForPick } from '@/core/characterPlays/characterPlayUsage';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

type CharacterPlaySelectionProps = {
  slots: CharacterPlaySlotRef[];
  attackIndex: number;
  displayIdx: number;
};

/** Character-play options offered after a GB / 1GB playbook result. */
export const CharacterPlaySelection = ({
  slots,
  attackIndex,
  displayIdx,
}: CharacterPlaySelectionProps) => {
  const {
    attacker,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    activeBaseCount,
    dispatch,
  } = useMeatGrinderSimulation();

  const actionable = slots
    .map(({ pickIndex }) => ({
      pickIndex,
      ...characterPlayAvailabilityForPick(
        attacker,
        wrapPicks,
        characterPlayPicks,
        attackIndex,
        pickIndex,
        damageMods,
        activeBaseCount,
      ),
    }))
    .filter((slot) => !slot.depleted);

  if (actionable.length === 0) {
    return null;
  }

  const multipleSlots = actionable.length > 1;
  const attackOrdinal = displayIdx + 1;

  return (
    <Section aria-label={`Character play for attack ${attackOrdinal}`}>
      <SectionHeading>Character Play</SectionHeading>
      {actionable.map(({ pickIndex, available }, slotIdx) => {
        const pick = characterPlayPicks[attackIndex]?.[pickIndex];
        const slotOrdinal = slotIdx + 1;
        const slotSuffix = multipleSlots ? `, play ${slotOrdinal}` : '';

        return (
          <SlotRow key={pickIndex}>
            {multipleSlots ? (
              <SlotTag aria-hidden="true">{slotOrdinal}</SlotTag>
            ) : null}
            <Pills>
              {available.map((cp) => {
                const summary = characterPlayEffectSummary(cp);

                return (
                  <PlayPill
                    key={cp.id}
                    active={pick === cp.id}
                    muted={!characterPlayHasEffect(cp)}
                    description={summary}
                    ariaLabel={`${cp.label} (${summary}) for attack ${attackOrdinal}${slotSuffix}`}
                    onClick={() =>
                      dispatch({
                        type: 'characterPlayPick',
                        attackIndex,
                        pickIndex,
                        pick: cp.id,
                      })
                    }
                  >
                    {cp.label}
                  </PlayPill>
                );
              })}
            </Pills>
          </SlotRow>
        );
      })}
    </Section>
  );
};
