import { useId, useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';
import {
  characterPlayAvailabilityForPick,
  characterPlayEffectSummary,
  characterPlayHasEffect,
} from '@/core/playbook';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import { ToggleButton } from '@/components/controls';
import type {
  AttacksPanelProps,
  CharacterPlaySlotRef,
} from '@/types/components/attacks';

/** Groups the character-play picks and separates them from the playbook grid above. */
const Section = styled.div`
  margin-top: 0.6rem;
  padding-top: 0.55rem;
  border-top: 1px dashed var(--border);

  ${narrowViewport} {
    margin-top: 0.45rem;
    padding-top: 0.45rem;
  }
`;

const SectionHeading = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin-bottom: 0.4rem;
`;

/** One pick slot (each GB / 1GB result grants one). */
const SlotRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.65rem;
  margin-top: 0.45rem;

  &:first-of-type {
    margin-top: 0;
  }

  ${narrowViewport} {
    gap: 0.35rem 0.4rem;
    margin-top: 0.35rem;
  }
`;

/** Small ordinal badge shown only when there is more than one pick slot. */
const SlotTag = styled.span`
  flex: 0 0 auto;
  min-width: 1.35rem;
  height: 1.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
`;

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.65rem;
  min-width: 0;
  flex: 1 1 auto;

  ${narrowViewport} {
    gap: 0.35rem 0.4rem;
  }
`;

const PillWrap = styled.span`
  position: relative;
  display: inline-flex;
`;

const SelectionBtn = styled(ToggleButton)<{ $muted?: boolean }>`
  min-width: 8.5rem;

  /* No-op plays (e.g. Snack Break) read as cosmetic via a dashed outline. */
  ${(p) => (p.$muted && !p.$active ? 'border-style: dashed;' : '')}

  ${narrowViewport} {
    min-width: 6.75rem;
  }
`;

/** Hover/focus tooltip describing a play's effect and cadence. */
const Bubble = styled.span`
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 20;
  width: max-content;
  max-width: min(16rem, 80vw);
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--popover-bg);
  color: var(--text);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  font-size: 0.74rem;
  font-weight: 400;
  line-height: 1.4;
  white-space: normal;
  text-align: left;
  letter-spacing: normal;
  text-transform: none;
`;

function PlayPill({
  active,
  muted,
  description,
  ariaLabel,
  onClick,
  children,
}: {
  active: boolean;
  muted: boolean;
  description: string;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <PillWrap
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SelectionBtn
        type="button"
        $active={active}
        $muted={muted}
        aria-label={ariaLabel}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={onClick}
      >
        {children}
      </SelectionBtn>
      {open ? (
        <Bubble id={tooltipId} role="tooltip">
          {description}
        </Bubble>
      ) : null}
    </PillWrap>
  );
}

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

  const multipleSlots = actionable.length > 1;
  const attackOrdinal = displayIdx + 1;

  return (
    <Section aria-label={`Character play for attack ${attackOrdinal}`}>
      <SectionHeading>Character Play</SectionHeading>
      {actionable.map(({ pickIndex }, slotIdx) => {
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
        const slotOrdinal = slotIdx + 1;

        return (
          <SlotRow key={pickIndex}>
            {multipleSlots ? (
              <SlotTag aria-hidden="true">{slotOrdinal}</SlotTag>
            ) : null}
            <Pills>
              {available.map((cp) => {
                const summary = characterPlayEffectSummary(cp);
                const slotSuffix = multipleSlots ? `, play ${slotOrdinal}` : '';
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
}
