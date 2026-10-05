import styles from '@/components/attacks/plays/CharacterPlaySelection.module.css';
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
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: predates the CSS Modules move; giving the div a role changes the accessibility tree, so it is a separate fix.
    <div
      className={styles.section}
      aria-label={`Character play for attack ${attackNumber}`}
    >
      <div className={styles.sectionHeading}>Character Play</div>
      {actionable.map(({ pickIndex, available }, slotIndex) => {
        const pick = characterPlayPicks[attackIndex]?.[pickIndex];
        const slotOrdinal = slotIndex + 1;
        const slotSuffix = multipleSlots ? `, play ${slotOrdinal}` : '';

        return (
          <div className={styles.slotRow} key={pickIndex}>
            {multipleSlots ? (
              <span className={styles.slotTag} aria-hidden="true">
                {slotOrdinal}
              </span>
            ) : null}
            <div className={styles.pills}>
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
            </div>
          </div>
        );
      })}
    </div>
  );
};
