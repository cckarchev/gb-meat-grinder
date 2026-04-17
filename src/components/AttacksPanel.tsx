import { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { AttackRollContext } from '../attackSequence';
import { BASE_ATTACK_COUNT } from '../constants';
import {
  PLAYBOOK,
  attackRowIsBerserker,
  choiceUsesGbFollowUp,
  damageIfAllHitsWrap,
  gbFollowUpAvailabilityForPick,
  kdAlreadyTakenBeforePick,
  wrapExtendedNetNeeded,
  wrapSlotBudget,
  type GbFollowUp,
  type GbFollowUpSlot,
  type PlaybookChoiceId,
  type WrapPick,
} from '../playbook';
import {
  probHeatBackground,
  probHeatBorder,
  probHeatTextColor,
} from '../probStyle';
import {
  formatPercent,
  maxNetSuccessesForRoll,
  probAttackSucceeds,
} from '../probability';
import { Mono, Panel } from './ui';

export type AttacksPanelProps = {
  /** Target HP before the activation; remaining HP is shown after each swing if it hits with the current wrap. */
  targetHp: number;
  armor: number;
  chargeAttackIndex: number;
  onChargeAttackIndexChange: (index: number) => void;
  wrapPicks: WrapPick[][];
  gbFollowUps: GbFollowUpSlot[][];
  onChoiceChange: (
    attackIndex: number,
    pickIndex: number,
    id: PlaybookChoiceId | null,
  ) => void;
  onGbFollowUpChange: (
    attackIndex: number,
    pickIndex: number,
    follow: GbFollowUp,
  ) => void;
  /** Called when the “additional wrap” accordion is closed; clears wrap picks after the first slot. */
  onWrapContinuationCleared: (attackIndex: number) => void;
  attacks: AttackRollContext[];
};

const AttacksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AttackRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem 1.25rem;
  width: 100%;
`;

const AttackMain = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

/** TAC / DEF / HP outside the bordered card so they stay easy to scan. */
const AttackStatsRail = styled.aside`
  flex: 0 0 auto;
  text-align: right;
  padding: 0.5rem 0.15rem 0 0;
  min-width: 2rem;
`;

const AttackStatBlock = styled.div`
  margin-bottom: 0.45rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const AttackStatCaption = styled.span`
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin-bottom: 0.08rem;
`;

const AttackStatMono = styled(Mono)`
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text);
`;

const AttackHpRailBlock = styled.div`
  margin-top: 0.55rem;
  padding-top: 0.55rem;
  border-top: 1px solid var(--border);
`;

const AttackHpValue = styled(Mono)`
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--text);
  letter-spacing: -0.02em;
`;

type AttackBlockVariant = 'charge' | 'berserker' | 'base';

const AttackBlock = styled.div<{ $variant: AttackBlockVariant }>`
  border-radius: 10px;
  padding: 0.65rem 0.75rem 0.85rem;
  border: 1px solid var(--border);
  background: var(--panel);

  ${(p) =>
    p.$variant === 'charge'
      ? `
    border-color: #1565c0;
    background: color-mix(in srgb, #1565c0 10%, var(--panel));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, #1565c0 22%, transparent);
  `
      : p.$variant === 'berserker'
        ? `
    border-color: #c62828;
    background: color-mix(in srgb, #c62828 11%, var(--panel));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, #c62828 24%, transparent);
  `
        : ''}
`;

const AttackMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 1rem;
  margin-bottom: 0.65rem;
  font-size: 0.88rem;
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--muted);
`;

const AttackKindLabel = styled.span`
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text);
`;

const ChargeWrap = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  color: var(--text);
  font-size: 0.85rem;
`;

/** Charge radio sits after stats, aligned to the end of the row when space allows. */
const ChargeMetaSlot = styled(MetaItem)`
  margin-left: auto;
`;

/** Fixed-width tracks; sized for column heads + circular line buttons. */
const ColumnGrid = styled.div<{ $columnCount: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => Math.max(1, p.$columnCount)}, 3.65rem);
  gap: 0.4rem;
  align-items: stretch;
  width: max-content;
  max-width: 100%;
  min-width: 0;
`;

const ColumnBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
  background: var(--input-bg);
`;

/** Pushes playbook lines to the bottom when a column has fewer results. */
const ColumnResults = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding-bottom: 0.15rem;
`;

const ColumnHead = styled.div<{ $p: number }>`
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
  padding: 0.4rem 0.35rem;
  line-height: 1.25;
  background: ${(p) => probHeatBackground(p.$p)};
  color: ${(p) => probHeatTextColor(p.$p)};
  border-bottom: 1px solid ${(p) => probHeatBorder(p.$p)};
`;

/** Small circles: non-momentous neutral, momentous momentum (red). */
const LineButton = styled.button<{ $momentous: boolean; $selected: boolean }>`
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
  text-align: center;
  box-sizing: border-box;
  width: 2.45rem;
  height: 2.45rem;
  max-width: 100%;
  margin: 0 auto 0.25rem;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  transition:
    box-shadow 0.12s ease,
    outline 0.12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  background: ${(p) =>
    p.$momentous ? '#b71c1c' : 'var(--playbook-line-nm-bg)'};
  color: ${(p) => (p.$momentous ? '#ffffff' : 'var(--playbook-line-nm-fg)')};
  border: 1px solid
    ${(p) => (p.$momentous ? '#7f1515' : 'var(--playbook-line-nm-border)')};

  &:hover {
    filter: brightness(1.06);
  }

  ${(p) =>
    p.$selected && p.$momentous
      ? `
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.92);
  `
      : p.$selected
        ? `
    box-shadow: inset 0 0 0 3px var(--playbook-line-nm-fg);
    outline: 2px solid var(--playbook-line-nm-fg);
    outline-offset: 2px;
  `
        : ''}

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
    filter: none;
  }

  &:disabled:hover {
    filter: none;
  }
`;

const CharacterPlaySection = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--border);
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
`;

const UnreachableNote = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: var(--muted);
`;

const WrapSlotBlock = styled.div<{ $first: boolean }>`
  margin-top: ${(p) => (p.$first ? 0 : '0.85rem')};
  padding-top: ${(p) => (p.$first ? 0 : '0.65rem')};
  border-top: ${(p) => (p.$first ? 'none' : '1px solid var(--border)')};
  /* Horizontal scroll only when needed; overflow-x:auto alone makes overflow-y compute to auto and can show a vertical scrollbar. */
  overflow-x: auto;
  overflow-y: hidden;
`;

/** Base playbook row: grid + narrow vertical wrap toggle on the right. */
const PlaybookRowWithVerticalWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.45rem;
`;

const PlaybookGridCell = styled.div`
  flex: 0 1 auto;
  min-width: 0;
`;

const VerticalWrapToggle = styled.button`
  align-self: stretch;
  flex-shrink: 0;
  width: 3rem;
  min-height: 4.5rem;
  margin: 0;
  padding: 0.4rem 0.15rem 0.35rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.25rem;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;

  &:hover {
    background: var(--input-bg);
    border-color: var(--muted);
  }

  &:focus-visible {
    outline: 2px solid var(--text);
    outline-offset: 2px;
  }
`;

/** Fills space above the chevron so the label stays visually centered in the upper band. */
const VerticalWrapLabelWrap = styled.span`
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  width: 100%;
`;

/** True vertical typesetting (upright glyphs, top-to-bottom). */
const VerticalWrapLabel = styled.span`
  writing-mode: vertical-rl;
  text-orientation: upright;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.06em;
`;

const ChevronCaret = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  font-size: 0.62rem;
  line-height: 1;
  color: var(--muted);
  transition: transform 0.18s ease;
  transform: rotate(${({ $open }) => ($open ? 0 : -90)}deg);

  &::before {
    content: '▼';
  }
`;

const VerticalWrapChevron = styled(ChevronCaret)`
  margin-top: auto;
`;

type GbSlotRef = { pid: PlaybookChoiceId; pickIndex: number };

function WrapSlotPickGrid({
  attackIndex,
  pickIndex,
  tac,
  pHit,
  armor,
  maxNet,
  wrapPicks,
  firstSlotInSection,
  onChoiceChange,
}: {
  attackIndex: number;
  pickIndex: number;
  tac: number;
  pHit: number;
  armor: number;
  maxNet: number;
  wrapPicks: WrapPick[][];
  firstSlotInSection: boolean;
  onChoiceChange: AttacksPanelProps['onChoiceChange'];
}) {
  const i = attackIndex;
  const budget = wrapSlotBudget(maxNet, pickIndex);
  const visibleColumns = PLAYBOOK.filter((c) => c.netSuccesses <= budget);

  return (
    <WrapSlotBlock $first={firstSlotInSection}>
      <ColumnGrid $columnCount={visibleColumns.length}>
        {visibleColumns.map((col) => {
          const netForHeat = wrapExtendedNetNeeded(pickIndex, col.netSuccesses);
          const pCol = probAttackSucceeds(tac, pHit, armor, netForHeat);
          return (
            <ColumnBlock key={col.netSuccesses}>
              <ColumnHead $p={pCol}>{formatPercent(pCol, 1)}</ColumnHead>
              <ColumnResults>
                {col.results.map((e) => {
                  const selected = wrapPicks[i][pickIndex] === e.id;
                  const kdLocked =
                    e.id === 'kd' &&
                    kdAlreadyTakenBeforePick(wrapPicks, i, pickIndex);
                  return (
                    <LineButton
                      key={e.id}
                      type="button"
                      disabled={kdLocked}
                      $momentous={e.momentum === true}
                      $selected={selected}
                      aria-pressed={selected}
                      title={
                        kdLocked
                          ? 'Knock Down already used this activation (target is KD)'
                          : undefined
                      }
                      onClick={() => {
                        if (pickIndex > 0 && selected) {
                          onChoiceChange(i, pickIndex, null);
                        } else {
                          onChoiceChange(i, pickIndex, e.id);
                        }
                      }}
                    >
                      {e.label}
                    </LineButton>
                  );
                })}
              </ColumnResults>
            </ColumnBlock>
          );
        })}
      </ColumnGrid>
    </WrapSlotBlock>
  );
}

function GbSlotsSection({
  slots,
  wrapPicks,
  gbFollowUps,
  attackIndex,
  displayIdx,
  onGbFollowUpChange,
}: {
  slots: GbSlotRef[];
  wrapPicks: WrapPick[][];
  gbFollowUps: GbFollowUpSlot[][];
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

export function AttacksPanel({
  targetHp,
  armor,
  chargeAttackIndex,
  onChargeAttackIndexChange,
  wrapPicks,
  gbFollowUps,
  onChoiceChange,
  onGbFollowUpChange,
  onWrapContinuationCleared,
  attacks,
}: AttacksPanelProps) {
  const [wrapExpanded, setWrapExpanded] = useState(() => new Set<number>());

  const toggleWrapExpanded = (attackIndex: number) => {
    setWrapExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(attackIndex)) next.delete(attackIndex);
      else next.add(attackIndex);
      return next;
    });
  };

  const rowDamageIfHit = useMemo(
    () => damageIfAllHitsWrap(wrapPicks),
    [wrapPicks],
  );
  const remainingHpAfterSwing = useMemo(() => {
    const out: number[] = [];
    let dealt = 0;
    for (const ctx of attacks) {
      dealt += rowDamageIfHit[ctx.attackIndex];
      out.push(Math.max(0, targetHp - dealt));
    }
    return out;
  }, [attacks, rowDamageIfHit, targetHp]);

  return (
    <Panel>
      <AttacksList>
        {attacks.map((a, displayIdx) => {
          const i = a.attackIndex;
          const maxNet = maxNetSuccessesForRoll(a.tac, armor);
          const gbSlots = wrapPicks[i]
            .map((pid, pickIndex) => ({ pid, pickIndex }))
            .filter(
              (x): x is GbSlotRef =>
                x.pid != null && choiceUsesGbFollowUp(x.pid),
            );
          const gbSlotsBase = gbSlots.filter((s) => s.pickIndex === 0);
          const gbSlotsWrap = gbSlots.filter((s) => s.pickIndex > 0);
          const hasWrapContinuation = wrapPicks[i].length > 1;
          const wrapOpen = wrapExpanded.has(i);
          const attackVariant: AttackBlockVariant = attackRowIsBerserker(i)
            ? 'berserker'
            : i < BASE_ATTACK_COUNT && i === chargeAttackIndex
              ? 'charge'
              : 'base';

          return (
            <AttackRow key={i}>
              <AttackMain>
                <AttackBlock $variant={attackVariant}>
                  <AttackMeta>
                    <AttackKindLabel>
                      {attackRowIsBerserker(i)
                        ? 'Berserker attack'
                        : i === chargeAttackIndex
                          ? 'Charge attack'
                          : 'Base attack'}
                    </AttackKindLabel>
                    {i < BASE_ATTACK_COUNT ? (
                      <ChargeMetaSlot>
                        <ChargeWrap>
                          <input
                            type="radio"
                            name="charge-attack"
                            checked={chargeAttackIndex === i}
                            onChange={() => onChargeAttackIndexChange(i)}
                          />
                          <span>+4 TAC charge</span>
                        </ChargeWrap>
                      </ChargeMetaSlot>
                    ) : null}
                  </AttackMeta>

                  {maxNet < 1 ? (
                    <UnreachableNote>
                      No playbook column reachable: TAC − ARM is {maxNet}. Raise
                      TAC (charge, Singled Out) or lower ARM.
                    </UnreachableNote>
                  ) : (
                    <>
                      <PlaybookRowWithVerticalWrap>
                    <PlaybookGridCell>
                      <WrapSlotPickGrid
                        key={`${i}-pick-0`}
                        attackIndex={i}
                        pickIndex={0}
                        tac={a.tac}
                        pHit={a.pHit}
                        armor={armor}
                        maxNet={maxNet}
                        wrapPicks={wrapPicks}
                        firstSlotInSection
                        onChoiceChange={onChoiceChange}
                      />
                    </PlaybookGridCell>
                    {hasWrapContinuation ? (
                      <VerticalWrapToggle
                        type="button"
                        id={`attack-wrap-trigger-${i}`}
                        aria-expanded={wrapOpen}
                        aria-controls={`attack-wrap-${i}`}
                        title={
                          wrapOpen
                            ? 'Close additional wrap and clear extra picks'
                            : 'Open additional wrap'
                        }
                        onClick={() => {
                          if (wrapOpen) onWrapContinuationCleared(i);
                          toggleWrapExpanded(i);
                        }}
                      >
                        <VerticalWrapLabelWrap>
                          <VerticalWrapLabel>
                            {wrapOpen ? 'Close' : 'Wrap'}
                          </VerticalWrapLabel>
                        </VerticalWrapLabelWrap>
                        <VerticalWrapChevron $open={wrapOpen} aria-hidden />
                      </VerticalWrapToggle>
                    ) : null}
                  </PlaybookRowWithVerticalWrap>
                  <GbSlotsSection
                        slots={gbSlotsBase}
                        wrapPicks={wrapPicks}
                        gbFollowUps={gbFollowUps}
                        attackIndex={i}
                        displayIdx={displayIdx}
                        onGbFollowUpChange={onGbFollowUpChange}
                      />
                      {hasWrapContinuation ? (
                        <div
                          id={`attack-wrap-${i}`}
                          role="region"
                          aria-labelledby={`attack-wrap-trigger-${i}`}
                          hidden={!wrapOpen}
                        >
                          {wrapPicks[i].slice(1).map((_, slot) => {
                            const pickIndex = slot + 1;
                            return (
                              <WrapSlotPickGrid
                                key={`${i}-pick-${pickIndex}`}
                                attackIndex={i}
                                pickIndex={pickIndex}
                                tac={a.tac}
                                pHit={a.pHit}
                                armor={armor}
                                maxNet={maxNet}
                                wrapPicks={wrapPicks}
                                firstSlotInSection={pickIndex === 1}
                                onChoiceChange={onChoiceChange}
                              />
                            );
                          })}
                          <GbSlotsSection
                            slots={gbSlotsWrap}
                            wrapPicks={wrapPicks}
                            gbFollowUps={gbFollowUps}
                            attackIndex={i}
                            displayIdx={displayIdx}
                            onGbFollowUpChange={onGbFollowUpChange}
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </AttackBlock>
              </AttackMain>
              <AttackStatsRail aria-label="Attack roll stats">
                <AttackStatBlock>
                  <AttackStatCaption>TAC</AttackStatCaption>
                  <AttackStatMono>{a.tac}</AttackStatMono>
                </AttackStatBlock>
                <AttackStatBlock>
                  <AttackStatCaption>DEF</AttackStatCaption>
                  <AttackStatMono>{a.defMinRoll}+</AttackStatMono>
                </AttackStatBlock>
                <AttackHpRailBlock>
                  <AttackStatCaption>HP</AttackStatCaption>
                  <AttackHpValue>
                    {remainingHpAfterSwing[displayIdx]}
                  </AttackHpValue>
                </AttackHpRailBlock>
              </AttackStatsRail>
            </AttackRow>
          );
        })}
      </AttacksList>
    </Panel>
  );
}
