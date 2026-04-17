import styled from 'styled-components';
import { narrowViewport } from '../../styles/breakpoints';
import type { AttackRollContext } from '../../core/attackSequence';
import { BASE_ATTACK_COUNT } from '../../core/constants';
import { choiceUsesGbFollowUp } from '../../core/playbook';
import { maxNetSuccessesForRoll } from '../../core/probability';
import {
  type AttackBlockVariant,
  attackBlockVariant,
  attackKindLabel,
} from './attackVariant';
import { AttackStatsAside } from './AttackStatsAside';
import { GbFollowUpSection } from './GbFollowUpSection';
import { WrapSlotPickGrid } from './PlaybookGrid';
import type { AttacksPanelProps, GbSlotRef } from './types';
import { VerticalWrapStrip } from './VerticalWrapStrip';

const AttackRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem 1.25rem;
  width: 100%;

  ${narrowViewport} {
    gap: 0.5rem 0.45rem;
  }
`;

const AttackMain = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

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

  ${narrowViewport} {
    padding: 0.5rem 0.55rem 0.65rem;
    border-radius: 8px;
  }
`;

const AttackMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 1rem;
  margin-bottom: 0.65rem;
  font-size: 0.88rem;

  ${narrowViewport} {
    gap: 0.4rem 0.55rem;
    margin-bottom: 0.45rem;
    font-size: 0.82rem;
  }
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

const ChargeMetaSlot = styled(MetaItem)`
  margin-left: auto;
`;

const PlaybookRowWithVerticalWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.45rem;

  ${narrowViewport} {
    gap: 0.28rem;
  }
`;

const PlaybookGridCell = styled.div`
  flex: 0 1 auto;
  min-width: 0;
`;

const UnreachableNote = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: var(--muted);
`;

export function AttackSwingRow({
  attack,
  displayIdx,
  armor,
  chargeAttackIndex,
  wrapPicks,
  gbFollowUps,
  remainingHpIfHit,
  wrapOpen,
  onChargeAttackIndexChange,
  onChoiceChange,
  onGbFollowUpChange,
  onToggleWrapExpansion,
  onWrapContinuationCleared,
}: {
  attack: AttackRollContext;
  displayIdx: number;
  armor: number;
  chargeAttackIndex: number;
  wrapPicks: AttacksPanelProps['wrapPicks'];
  gbFollowUps: AttacksPanelProps['gbFollowUps'];
  remainingHpIfHit: number;
  wrapOpen: boolean;
  onChargeAttackIndexChange: AttacksPanelProps['onChargeAttackIndexChange'];
  onChoiceChange: AttacksPanelProps['onChoiceChange'];
  onGbFollowUpChange: AttacksPanelProps['onGbFollowUpChange'];
  onToggleWrapExpansion: () => void;
  onWrapContinuationCleared: AttacksPanelProps['onWrapContinuationCleared'];
}) {
  const i = attack.attackIndex;
  const maxNet = maxNetSuccessesForRoll(attack.tac, armor);
  const gbSlots = wrapPicks[i]
    .map((pid, pickIndex) => ({ pid, pickIndex }))
    .filter(
      (x): x is GbSlotRef =>
        x.pid != null && choiceUsesGbFollowUp(x.pid),
    );
  const gbSlotsBase = gbSlots.filter((s) => s.pickIndex === 0);
  const gbSlotsWrap = gbSlots.filter((s) => s.pickIndex > 0);
  const hasWrapContinuation = wrapPicks[i].length > 1;
  const variant = attackBlockVariant(i, chargeAttackIndex);

  return (
    <AttackRow>
      <AttackMain>
        <AttackBlock $variant={variant}>
          <AttackMeta>
            <AttackKindLabel>
              {attackKindLabel(i, chargeAttackIndex)}
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
              No playbook column reachable: TAC − ARM is {maxNet}. Raise TAC
              (charge, Singled Out) or lower ARM.
            </UnreachableNote>
          ) : (
            <>
              <PlaybookRowWithVerticalWrap>
                <PlaybookGridCell>
                  <WrapSlotPickGrid
                    attackIndex={i}
                    pickIndex={0}
                    tac={attack.tac}
                    pHit={attack.pHit}
                    armor={armor}
                    maxNet={maxNet}
                    wrapPicks={wrapPicks}
                    firstSlotInSection
                    onChoiceChange={onChoiceChange}
                  />
                </PlaybookGridCell>
                {hasWrapContinuation ? (
                  <VerticalWrapStrip
                    attackIndex={i}
                    wrapOpen={wrapOpen}
                    onClick={() => {
                      if (wrapOpen) onWrapContinuationCleared(i);
                      onToggleWrapExpansion();
                    }}
                  />
                ) : null}
              </PlaybookRowWithVerticalWrap>
              <GbFollowUpSection
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
                        key={pickIndex}
                        attackIndex={i}
                        pickIndex={pickIndex}
                        tac={attack.tac}
                        pHit={attack.pHit}
                        armor={armor}
                        maxNet={maxNet}
                        wrapPicks={wrapPicks}
                        firstSlotInSection={pickIndex === 1}
                        onChoiceChange={onChoiceChange}
                      />
                    );
                  })}
                  <GbFollowUpSection
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
      <AttackStatsAside
        tac={attack.tac}
        defMinRoll={attack.defMinRoll}
        remainingHpIfHit={remainingHpIfHit}
      />
    </AttackRow>
  );
}
