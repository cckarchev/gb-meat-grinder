import { useMemo, useState } from 'react';
import type { AttackRollContext } from '../attackSequence';
import { BASE_ATTACK_COUNT } from '../constants';
import {
  PLAYBOOK,
  choiceUsesGbFollowUp,
  damageIfAllHitsWrap,
  gbFollowUpAvailabilityForPick,
  kdAlreadyTakenBeforePick,
  type GbFollowUp,
  type GbFollowUpSlot,
  type PlaybookChoiceId,
  type WrapPick,
  wrapExtendedNetNeeded,
  wrapSlotBudget,
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
import styled from 'styled-components';

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

const AttackBlock = styled.div`
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.65rem 0.75rem 0.85rem;
  background: var(--panel);
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

const ChargeWrap = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  color: var(--text);
  font-size: 0.85rem;
`;

/** Fixed-width tracks so columns do not stretch with the panel; width matches column count. */
const ColumnGrid = styled.div<{ $columnCount: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${(p) => Math.max(1, p.$columnCount)},
    5.35rem
  );
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

/** Non-momentous: neutral. Momentous: red (momentum). Narrow, ~square hit target. */
const LineButton = styled.button<{ $momentous: boolean; $selected: boolean }>`
  font: inherit;
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.15;
  text-align: center;
  box-sizing: border-box;
  width: 4.55rem;
  max-width: 100%;
  aspect-ratio: 1;
  margin: 0 auto 0.25rem;
  padding: 0.2rem 0.25rem;
  border-radius: 3px;
  cursor: pointer;
  transition: box-shadow 0.12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: ${(p) => (p.$momentous ? '#b71c1c' : 'var(--input-bg)')};
  color: ${(p) => (p.$momentous ? '#ffffff' : 'var(--text)')};
  border: 1px solid ${(p) => (p.$momentous ? '#7f1515' : 'var(--border)')};

  &:hover {
    filter: brightness(1.06);
  }

  ${(p) =>
    p.$selected
      ? `
    box-shadow: inset 0 0 0 2px var(--text);
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
  overflow-x: auto;
`;

const WrapExpandTrigger = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.55rem;
  padding: 0.55rem 0.75rem;
  font: inherit;
  font-size: 0.88rem;
  color: var(--text);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
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

const WrapExpandTitle = styled.span`
  font-weight: 600;
  flex-shrink: 0;
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
              <ColumnHead $p={pCol}>
                Col {col.netSuccesses} · {formatPercent(pCol, 1)}
              </ColumnHead>
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

          return (
            <AttackBlock key={i}>
              <AttackMeta>
                {i < BASE_ATTACK_COUNT ? (
                  <ChargeWrap>
                    <input
                      type="radio"
                      name="charge-attack"
                      checked={chargeAttackIndex === i}
                      onChange={() => onChargeAttackIndexChange(i)}
                    />
                    <span>Charge (+4 TAC)</span>
                  </ChargeWrap>
                ) : null}
                <MetaItem>
                  TAC <Mono>{a.tac}</Mono>
                </MetaItem>
                <MetaItem>
                  DEF <Mono>{a.defMinRoll}+</Mono>
                </MetaItem>
                <MetaItem>
                  Remaining HP <Mono>{remainingHpAfterSwing[displayIdx]}</Mono>
                </MetaItem>
              </AttackMeta>

              {maxNet < 1 ? (
                <UnreachableNote>
                  No playbook column reachable: TAC − ARM is {maxNet}. Raise TAC
                  (charge, Singled Out) or lower ARM.
                </UnreachableNote>
              ) : (
                <>
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
                  <GbSlotsSection
                    slots={gbSlotsBase}
                    wrapPicks={wrapPicks}
                    gbFollowUps={gbFollowUps}
                    attackIndex={i}
                    displayIdx={displayIdx}
                    onGbFollowUpChange={onGbFollowUpChange}
                  />
                  {hasWrapContinuation ? (
                    <>
                      <WrapExpandTrigger
                        type="button"
                        id={`attack-wrap-trigger-${i}`}
                        aria-expanded={wrapOpen}
                        aria-controls={`attack-wrap-${i}`}
                        onClick={() => {
                          if (wrapOpen) onWrapContinuationCleared(i);
                          toggleWrapExpanded(i);
                        }}
                      >
                        <WrapExpandTitle>
                          {wrapOpen ? 'Remove wrap result' : 'Add wrap result'}
                        </WrapExpandTitle>
                        <span style={{ flex: 1, minWidth: 0 }} aria-hidden />
                        <ChevronCaret $open={wrapOpen} aria-hidden />
                      </WrapExpandTrigger>
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
                    </>
                  ) : null}
                </>
              )}
            </AttackBlock>
          );
        })}
      </AttacksList>
      {/*
        Previously: P(all 6) + wrap / GB explanation in <Summary>.
      */}
    </Panel>
  );
}
