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
import { attackOrdinal } from '@/core/shared/format';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

type CharacterPlaySelectionProps = {
  /** Slots of this swing whose pick grants a character play. */
  pickIndexes: number[];
  attackIndex: number;
  displayIndex: number;
};

/** Character-play options offered after a GB / 1GB playbook result. */
export const CharacterPlaySelection = ({
  pickIndexes,
  attackIndex,
  displayIndex,
}: CharacterPlaySelectionProps) => {
  const {
    attacker,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    activeBaseCount,
    dispatch,
  } = useMeatGrinderSimulation();

  const actionable = pickIndexes
    .map((pickIndex) => ({
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
  const attackNumber = attackOrdinal(displayIndex);

  return (
    <Section aria-label={`Character play for attack ${attackNumber}`}>
      <SectionHeading>Character Play</SectionHeading>
      {actionable.map(({ pickIndex, available }, slotIndex) => {
        const pick = characterPlayPicks[attackIndex]?.[pickIndex];
        const slotOrdinal = slotIndex + 1;
        const slotSuffix = multipleSlots ? `, play ${slotOrdinal}` : '';

        return (
          <SlotRow key={pickIndex}>
            {multipleSlots ? (
              <SlotTag aria-hidden="true">{slotOrdinal}</SlotTag>
            ) : null}
            <Pills>
              {available.map((play) => {
                const summary = characterPlayEffectSummary(play);

                return (
                  <PlayPill
                    key={play.id}
                    active={pick === play.id}
                    muted={!characterPlayHasEffect(play)}
                    description={summary}
                    ariaLabel={`${play.label} (${summary}) for attack ${attackNumber}${slotSuffix}`}
                    onClick={() =>
                      dispatch({
                        type: 'characterPlayPick',
                        attackIndex,
                        pickIndex,
                        pick: play.id,
                      })
                    }
                  >
                    {play.label}
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
