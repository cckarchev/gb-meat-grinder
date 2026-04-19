import styled from 'styled-components';
import { narrowViewport } from '@/styles/breakpoints';
import type { AttackRollContext } from '@/types/core/attackSequence';
import { BASE_ATTACK_COUNT } from '@/core/constants';
import { choiceUsesCharacterPlay } from '@/core/playbook';
import { maxNetSuccessesForRoll } from '@/core/probability';
import { attackBlockVariant, attackKindLabel } from '@/components/attacks/attackVariant';
import type { AttackBlockVariant } from '@/types/components/attacks';
import { Mono } from '@/components/ui';
import { AttackStatsAside } from '@/components/attacks/AttackStatsAside';
import { CharacterPlaySelection } from '@/components/attacks/CharacterPlaySelection';
import { WrapSlotPickGrid } from '@/components/attacks/PlaybookGrid';
import type {
  AttacksPanelProps,
  CharacterPlaySlotRef,
} from '@/types/components/attacks';
import { VerticalWrapStrip } from '@/components/attacks/VerticalWrapStrip';

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
    border: 2px solid #e65100;
    background: color-mix(in srgb, #ff9800 24%, var(--panel));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, #f57c00 38%, transparent),
      0 0 0 1px color-mix(in srgb, #fb8c00 40%, transparent);
  `
      : p.$variant === 'berserker'
        ? `
    border: 2px solid #b71c1c;
    background: color-mix(in srgb, #ef5350 24%, var(--panel));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, #c62828 38%, transparent),
      0 0 0 1px color-mix(in srgb, #e53935 40%, transparent);
  `
        : ''}

  ${narrowViewport} {
    padding: 0.5rem 0.55rem 0.65rem;
    border-radius: 8px;
  }
`;

const AttackHeading = styled.div`
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.45rem;

  ${narrowViewport} {
    font-size: 0.82rem;
    margin-bottom: 0.35rem;
  }
`;

const DicePoolStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.85rem;
  margin-bottom: 0.65rem;
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--input-bg) 88%, var(--border));

  ${narrowViewport} {
    gap: 0.45rem 0.55rem;
    padding: 0.42rem 0.5rem;
    margin-bottom: 0.5rem;
  }
`;

const PoolCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.85rem;
  min-width: 0;
  flex: 1 1 auto;
`;

const TacPoolBadge = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 0.35rem;
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: 0.35rem;
  border-left: 1px solid var(--border);

  ${narrowViewport} {
    flex: 1 1 100%;
    margin-left: 0;
    padding-left: 0;
    padding-top: 0.35rem;
    margin-top: 0.15rem;
    border-left: none;
    border-top: 1px solid var(--border);
    justify-content: flex-end;
  }
`;

const TacPoolLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
`;

const TacPoolValue = styled(Mono)`
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--text);

  ${narrowViewport} {
    font-size: 1.15rem;
  }
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
  const hasWrapContinuation = wrapPicks[i].length > 1;
  const variant = attackBlockVariant(i, chargeAttackIndex);
  const bonusTimeDisabled = !bonusTime && bonusTimeMomentumPool < 1;

  return (
    <AttackRow>
      <AttackMain>
        <AttackBlock $variant={variant}>
          <AttackHeading>{attackKindLabel(i, chargeAttackIndex)}</AttackHeading>
          <DicePoolStrip aria-label="Dice pool for this attack">
            <PoolCluster>
              {i < BASE_ATTACK_COUNT ? (
                <ChargeWrap>
                  <input
                    type="radio"
                    name="charge-attack"
                    checked={chargeAttackIndex === i}
                    onChange={() => onChargeAttackIndexChange(i)}
                  />
                  <span>+4 TAC charge</span>
                </ChargeWrap>
              ) : null}
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
            </PoolCluster>
            <TacPoolBadge>
              <TacPoolLabel>TAC</TacPoolLabel>
              <TacPoolValue>{attack.tac}</TacPoolValue>
            </TacPoolBadge>
          </DicePoolStrip>

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
                </div>
              ) : null}
              <CharacterPlaySelection
                slots={characterPlaySlots}
                wrapPicks={wrapPicks}
                characterPlayPicks={characterPlayPicks}
                damageMods={damageMods}
                attackIndex={i}
                displayIdx={displayIdx}
                onCharacterPlayPickChange={onCharacterPlayPickChange}
              />
            </>
          )}
        </AttackBlock>
      </AttackMain>
      <AttackStatsAside
        defMinRoll={attack.defMinRoll}
        momentum={momentum}
        remainingHpIfHit={remainingHpIfHit}
      />
    </AttackRow>
  );
}
