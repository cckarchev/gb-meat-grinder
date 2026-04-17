import type { AttackRollContext } from '../attackSequence';
import {
  PLAYBOOK,
  choiceUsesGbFollowUp,
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

const ColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.35rem, 1fr));
  gap: 0.4rem;
  align-items: stretch;
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

const CharacterPlayHeading = styled.h3`
  margin: 0 0 0.45rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
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
`;

export function AttacksPanel({
  armor,
  chargeAttackIndex,
  onChargeAttackIndexChange,
  wrapPicks,
  gbFollowUps,
  onChoiceChange,
  onGbFollowUpChange,
  attacks,
}: AttacksPanelProps) {
  return (
    <Panel>
      <AttacksList>
        {attacks.map((a, i) => {
          const maxNet = maxNetSuccessesForRoll(a.tac, armor);
          const gbSlots = wrapPicks[i]
            .map((pid, pickIndex) => ({ pid, pickIndex }))
            .filter(
              (x): x is { pid: PlaybookChoiceId; pickIndex: number } =>
                x.pid != null && choiceUsesGbFollowUp(x.pid),
            );

          return (
            <AttackBlock key={i}>
              <AttackMeta>
                <MetaItem>
                  <Mono style={{ color: 'var(--text)' }}>#{i + 1}</Mono>
                </MetaItem>
                <ChargeWrap>
                  <input
                    type="radio"
                    name="charge-attack"
                    checked={chargeAttackIndex === i}
                    onChange={() => onChargeAttackIndexChange(i)}
                  />
                  <span>Charge (+4 TAC)</span>
                </ChargeWrap>
                <MetaItem>
                  TAC <Mono>{a.tac}</Mono>
                </MetaItem>
                <MetaItem>
                  DEF <Mono>{a.defMinRoll}+</Mono>
                </MetaItem>
              </AttackMeta>

              {maxNet < 1 ? (
                <UnreachableNote>
                  No playbook column reachable: TAC − ARM is {maxNet}. Raise TAC
                  (charge, Singled Out) or lower ARM.
                </UnreachableNote>
              ) : (
                <>
                  {wrapPicks[i].map((_, pickIndex) => {
                    const budget = wrapSlotBudget(maxNet, pickIndex);
                    const visibleColumns = PLAYBOOK.filter(
                      (c) => c.netSuccesses <= budget,
                    );

                    return (
                      <WrapSlotBlock key={pickIndex} $first={pickIndex === 0}>
                        <ColumnGrid>
                          {visibleColumns.map((col) => {
                            const netForHeat = wrapExtendedNetNeeded(
                              pickIndex,
                              col.netSuccesses,
                            );
                            const pCol = probAttackSucceeds(
                              a.tac,
                              a.pHit,
                              armor,
                              netForHeat,
                            );
                            return (
                              <ColumnBlock key={col.netSuccesses}>
                                <ColumnHead $p={pCol}>
                                  Col {col.netSuccesses} ·{' '}
                                  {formatPercent(pCol, 1)}
                                </ColumnHead>
                                <ColumnResults>
                                  {col.results.map((e) => {
                                    const selected =
                                      wrapPicks[i][pickIndex] === e.id;
                                    const kdLocked =
                                      e.id === 'kd' &&
                                      kdAlreadyTakenBeforePick(
                                        wrapPicks,
                                        i,
                                        pickIndex,
                                      );
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
                  })}
                  {gbSlots.length > 0 ? (
                    <CharacterPlaySection>
                      <CharacterPlayHeading>
                        Character Play selected
                      </CharacterPlayHeading>
                      {gbSlots.map(({ pickIndex }) => {
                        const gbAvail = gbFollowUpAvailabilityForPick(
                          wrapPicks,
                          gbFollowUps,
                          i,
                          pickIndex,
                        );
                        const follow = gbFollowUps[i]?.[pickIndex];
                        const pickOrdinal = pickIndex + 1;
                        const attackOrdinal = i + 1;
                        const soLabel = `Singled Out for attack ${attackOrdinal}, GB result ${pickOrdinal}`;
                        const stLabel = `Stagger for attack ${attackOrdinal}, GB result ${pickOrdinal}`;

                        return (
                          <CharacterPlayRow key={pickIndex}>
                            {!gbAvail.depleted &&
                            (gbAvail.canPickSo || gbAvail.canPickStagger) ? (
                              <>
                                {gbAvail.canPickSo ? (
                                  <CpBtn
                                    type="button"
                                    $active={follow === 'so'}
                                    aria-label={soLabel}
                                    onClick={() =>
                                      onGbFollowUpChange(i, pickIndex, 'so')
                                    }
                                  >
                                    Singled Out
                                  </CpBtn>
                                ) : null}
                                {gbAvail.canPickStagger ? (
                                  <CpBtn
                                    type="button"
                                    $active={follow === 'stagger'}
                                    aria-label={stLabel}
                                    onClick={() =>
                                      onGbFollowUpChange(
                                        i,
                                        pickIndex,
                                        'stagger',
                                      )
                                    }
                                  >
                                    Stagger
                                  </CpBtn>
                                ) : null}
                              </>
                            ) : (
                              <span
                                style={{
                                  color: 'var(--muted)',
                                  fontSize: '0.85rem',
                                }}
                                role="status"
                                aria-label={`No Character Play for attack ${attackOrdinal}, result ${pickOrdinal} — both plays used this activation`}
                              >
                                No Character Play — both used this activation.
                              </span>
                            )}
                          </CharacterPlayRow>
                        );
                      })}
                    </CharacterPlaySection>
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
