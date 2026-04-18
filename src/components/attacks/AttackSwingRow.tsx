import styled from 'styled-components';
import { narrowViewport } from '../../styles/breakpoints';
import type { AttackRollContext } from '../../core/attackSequence';
import { BASE_ATTACK_COUNT } from '../../core/constants';
import { choiceUsesCharacterPlay } from '../../core/playbook';
import { maxNetSuccessesForRoll } from '../../core/probability';
import {
  type AttackBlockVariant,
  attackBlockVariant,
  attackKindLabel,
} from './attackVariant';
import { AttackStatsAside } from './AttackStatsAside';
import { CharacterPlaySelection } from './CharacterPlaySelection';
import { WrapSlotPickGrid } from './PlaybookGrid';
import type { AttacksPanelProps, CharacterPlaySlotRef } from './types';
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

const BonusWrap = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  color: ${(p) => (p.$disabled ? 'var(--muted)' : 'var(--text)')};
  font-size: 0.85rem;
  user-select: none;
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
  characterPlayPicks,
  damageMods,
  remainingHpIfHit,
  momentum,
  bonusTime,
  bonusTimeMomentumPool,
  onBonusTimeChange,
  wrapOpen,
  onChargeAttackIndexChange,
  onChoiceChange,
  onCharacterPlayPickChange,
  onToggleWrapExpansion,
  onWrapContinuationCleared,
}: {
  attack: AttackRollContext;
  displayIdx: number;
  armor: number;
  chargeAttackIndex: number;
  wrapPicks: AttacksPanelProps['wrapPicks'];
  characterPlayPicks: AttacksPanelProps['characterPlayPicks'];
  damageMods: AttacksPanelProps['damageMods'];
  remainingHpIfHit: number;
  momentum: number;
  bonusTime: boolean;
  bonusTimeMomentumPool: number;
  onBonusTimeChange: AttacksPanelProps['onBonusTimeChange'];
  wrapOpen: boolean;
  onChargeAttackIndexChange: AttacksPanelProps['onChargeAttackIndexChange'];
  onChoiceChange: AttacksPanelProps['onChoiceChange'];
  onCharacterPlayPickChange: AttacksPanelProps['onCharacterPlayPickChange'];
  onToggleWrapExpansion: () => void;
  onWrapContinuationCleared: AttacksPanelProps['onWrapContinuationCleared'];
}) {
  const i = attack.attackIndex;
  const maxNet = maxNetSuccessesForRoll(attack.tac, armor);
  const characterPlaySlots = wrapPicks[i]
    .map((pid, pickIndex) => ({ pid, pickIndex }))
    .filter(
      (x): x is CharacterPlaySlotRef =>
        x.pid != null && choiceUsesCharacterPlay(x.pid),
    );
  const characterPlaySlotsBase = characterPlaySlots.filter(
    (s) => s.pickIndex === 0,
  );
  const characterPlaySlotsWrap = characterPlaySlots.filter(
    (s) => s.pickIndex > 0,
  );
  const hasWrapContinuation = wrapPicks[i].length > 1;
  const variant = attackBlockVariant(i, chargeAttackIndex);
  const bonusTimeDisabled = !bonusTime && bonusTimeMomentumPool < 1;

  return (
    <AttackRow>
      <AttackMain>
        <AttackBlock $variant={variant}>
          <AttackMeta>
            <AttackKindLabel>
              {attackKindLabel(i, chargeAttackIndex)}
            </AttackKindLabel>
            <MetaItem>
              <BonusWrap
                $disabled={bonusTimeDisabled}
                title={
                  bonusTimeDisabled
                    ? 'Bonus Time needs at least 1 momentum before this attack (costs 1 before the roll).'
                    : 'Bonus Time: +1 TAC this attack; spend 1 momentum before rolling.'
                }
              >
                <input
                  type="checkbox"
                  checked={bonusTime}
                  disabled={bonusTimeDisabled}
                  onChange={(e) => onBonusTimeChange(i, e.target.checked)}
                />
                <span>Bonus Time (+1 TAC)</span>
              </BonusWrap>
            </MetaItem>
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
                    damageMods={damageMods}
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
              <CharacterPlaySelection
                slots={characterPlaySlotsBase}
                wrapPicks={wrapPicks}
                characterPlayPicks={characterPlayPicks}
                damageMods={damageMods}
                attackIndex={i}
                displayIdx={displayIdx}
                onCharacterPlayPickChange={onCharacterPlayPickChange}
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
                        damageMods={damageMods}
                        firstSlotInSection={pickIndex === 1}
                        onChoiceChange={onChoiceChange}
                      />
                    );
                  })}
                  <CharacterPlaySelection
                    slots={characterPlaySlotsWrap}
                    wrapPicks={wrapPicks}
                    characterPlayPicks={characterPlayPicks}
                    damageMods={damageMods}
                    attackIndex={i}
                    displayIdx={displayIdx}
                    onCharacterPlayPickChange={onCharacterPlayPickChange}
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
        momentum={momentum}
        remainingHpIfHit={remainingHpIfHit}
      />
    </AttackRow>
  );
}
