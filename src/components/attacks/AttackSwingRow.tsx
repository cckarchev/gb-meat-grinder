import styled from 'styled-components';
import { extraNarrowViewport, narrowViewport } from '@/styles/breakpoints';
import type { AttackRollContext } from '@/types/core/attackSequence';
import { attackRowIsBerserker, choiceUsesCharacterPlay } from '@/core/playbook';
import { maxNetSuccessesForRoll } from '@/core/probability';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import {
  attackBlockVariant,
  attackKindLabel,
} from '@/components/attacks/attackVariant';
import type { AttackBlockVariant } from '@/types/components/attacks';
import { Mono } from '@/components/ui';
import { InfoTip } from '@/components/InfoTip';
import { AttackStatsAside } from '@/components/attacks/AttackStatsAside';
import { CharacterPlaySelection } from '@/components/attacks/CharacterPlaySelection';
import { WrapSlotPickGrid } from '@/components/attacks/PlaybookGrid';
import type {
  AttacksPanelProps,
  CharacterPlaySlotRef,
} from '@/types/components/attacks';
import {
  PLAYBOOK_COLUMN_TRACK,
  PLAYBOOK_COLUMN_WIDTH_VAR,
} from '@/components/attacks/playbookLayout';
import { WrapContinuationToggle } from '@/components/attacks/WrapContinuationToggle';

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
  ${PLAYBOOK_COLUMN_WIDTH_VAR}: ${PLAYBOOK_COLUMN_TRACK};
  border-radius: 10px;
  padding: 0.65rem 0.75rem 0.85rem;
  border: 1px solid var(--border);
  background: var(--panel);

  ${(p) =>
    p.$variant === 'charge'
      ? `
    border: 2px solid var(--accent-charge);
    background: color-mix(in srgb, var(--accent-charge-soft) 24%, var(--panel));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--accent-charge) 38%, transparent),
      0 0 0 1px color-mix(in srgb, var(--accent-charge-soft) 40%, transparent);
  `
      : p.$variant === 'berserker'
        ? `
    border: 2px solid var(--accent-berserker);
    background: color-mix(in srgb, var(--accent-berserker-soft) 24%, var(--panel));
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--accent-berserker) 38%, transparent),
      0 0 0 1px color-mix(in srgb, var(--accent-berserker-soft) 40%, transparent);
  `
        : ''}

  ${narrowViewport} {
    ${PLAYBOOK_COLUMN_WIDTH_VAR}: clamp(2.15rem, 10.5vw, ${PLAYBOOK_COLUMN_TRACK});
    padding: 0.5rem 0.55rem 0.65rem;
    border-radius: 8px;
  }

  ${extraNarrowViewport} {
    ${PLAYBOOK_COLUMN_WIDTH_VAR}: clamp(1.75rem, 11vw, ${PLAYBOOK_COLUMN_TRACK});
    padding: 0.45rem 0.45rem 0.55rem;
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

/** TAC readout + wrap toggle (wrap lives here so the playbook row can use full width). */
const TacPoolRight = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
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
    flex-wrap: wrap;
    gap: 0.4rem;
  }
`;

const TacPoolBadge = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 0.35rem;
  flex: 0 0 auto;
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

  input {
    accent-color: var(--focus-ring);
  }
`;

const BonusWrap = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  color: ${(p) => (p.$disabled ? 'var(--muted)' : 'var(--text)')};
  font-size: 0.85rem;
  user-select: none;

  input {
    accent-color: var(--focus-ring);
  }
`;

const PlaybookPrimarySlot = styled.div`
  width: 100%;
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
  charging,
  chargeAttackIndex,
  activeBaseCount,
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
  charging: boolean;
  chargeAttackIndex: number;
  activeBaseCount: number;
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
  const { attacker } = useMeatGrinderSimulation();
  const i = attack.attackIndex;
  const maxNet = maxNetSuccessesForRoll(attack.tac, armor);
  const characterPlaySlots = wrapPicks[i]
    .map((pid, pickIndex) => ({ pid, pickIndex }))
    .filter(
      (x): x is CharacterPlaySlotRef =>
        x.pid != null && choiceUsesCharacterPlay(attacker, x.pid),
    );
  const hasWrapContinuation = wrapPicks[i].length > 1;
  const variant = attackBlockVariant(attacker, i, chargeAttackIndex);
  const bonusTimeDisabled = !bonusTime && bonusTimeMomentumPool < 1;

  return (
    <AttackRow>
      <AttackMain>
        <AttackBlock $variant={variant}>
          <AttackHeading>
            {attackKindLabel(attacker, i, chargeAttackIndex)}
          </AttackHeading>
          <DicePoolStrip aria-label="Dice pool for this attack">
            <PoolCluster>
              {charging && !attackRowIsBerserker(attacker, i) ? (
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
              <BonusWrap $disabled={bonusTimeDisabled}>
                <input
                  type="checkbox"
                  checked={bonusTime}
                  disabled={bonusTimeDisabled}
                  onChange={(e) => onBonusTimeChange(i, e.target.checked)}
                />
                <InfoTip
                  content={
                    bonusTimeDisabled
                      ? 'Bonus Time needs at least 1 momentum before this attack (costs 1 before the roll).'
                      : 'Bonus Time: +1 Dice Pool this attack; spend 1 momentum before rolling.'
                  }
                >
                  Bonus Time (+1 Dice Pool)
                </InfoTip>
              </BonusWrap>
            </PoolCluster>
            <TacPoolRight>
              {hasWrapContinuation && maxNet >= 1 ? (
                <WrapContinuationToggle
                  attackIndex={i}
                  wrapOpen={wrapOpen}
                  onClick={() => {
                    if (wrapOpen) onWrapContinuationCleared(i);
                    onToggleWrapExpansion();
                  }}
                />
              ) : null}
              <TacPoolBadge>
                <TacPoolLabel>Dice Pool</TacPoolLabel>
                <TacPoolValue>{attack.tac}</TacPoolValue>
              </TacPoolBadge>
            </TacPoolRight>
          </DicePoolStrip>

          {maxNet < 1 ? (
            <UnreachableNote>
              No playbook column reachable: TAC − ARM is {maxNet}. Raise TAC
              (charge, Singled Out) or lower ARM.
            </UnreachableNote>
          ) : (
            <>
              <PlaybookPrimarySlot>
                <WrapSlotPickGrid
                  attackIndex={i}
                  pickIndex={0}
                  tac={attack.tac}
                  pHit={attack.pHit}
                  armor={armor}
                  maxNet={maxNet}
                  wrapPicks={wrapPicks}
                  damageMods={damageMods}
                  activeBaseCount={activeBaseCount}
                  firstSlotInSection
                  onChoiceChange={onChoiceChange}
                />
              </PlaybookPrimarySlot>
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
                        activeBaseCount={activeBaseCount}
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
                activeBaseCount={activeBaseCount}
                onCharacterPlayPickChange={onCharacterPlayPickChange}
              />
            </>
          )}
        </AttackBlock>
      </AttackMain>
      <AttackStatsAside
        defMinRoll={attack.defMinRoll}
        armor={armor}
        momentum={momentum}
        remainingHpIfHit={remainingHpIfHit}
      />
    </AttackRow>
  );
}
