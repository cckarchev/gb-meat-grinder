import {
  Pills,
  Section,
  SectionHeading,
  SlotRow,
  SlotTag,
} from '@/components/attacks/characterPlayStyles';
import { PlayPill } from '@/components/attacks/PlayPill';
import {
  characterPlayAvailabilityForPick,
  characterPlayEffectSummary,
  characterPlayHasEffect,
} from '@/core/characterPlayPicks';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import type {
  AttacksPanelProps,
  CharacterPlaySlotRef,
} from '@/types/components/attacks';

type CharacterPlaySelectionProps = {
  slots: CharacterPlaySlotRef[];
  wrapPicks: AttacksPanelProps['wrapPicks'];
  characterPlayPicks: AttacksPanelProps['characterPlayPicks'];
  damageMods: AttacksPanelProps['damageMods'];
  attackIndex: number;
  displayIdx: number;
  activeBaseCount: number;
  onCharacterPlayPickChange: AttacksPanelProps['onCharacterPlayPickChange'];
};

/** Character-play options offered after a GB / 1GB playbook result. */
export const CharacterPlaySelection = ({
  slots,
  wrapPicks,
  characterPlayPicks,
  damageMods,
  attackIndex,
  displayIdx,
  activeBaseCount,
  onCharacterPlayPickChange,
}: CharacterPlaySelectionProps) => {
  const { attacker } = useMeatGrinderSimulation();
  const i = attackIndex;

  const actionable = slots
    .map(({ pickIndex }) => ({
      pickIndex,
      ...characterPlayAvailabilityForPick(
        attacker,
        wrapPicks,
        characterPlayPicks,
        i,
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
        const pick = characterPlayPicks[i]?.[pickIndex];
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
                      onCharacterPlayPickChange(i, pickIndex, cp.id)
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
