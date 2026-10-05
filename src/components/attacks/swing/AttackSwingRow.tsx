import type { AttackSwingRowProps } from '@/components/attacks/attacks.types';
import { SwingPlaybook } from '@/components/attacks/playbook/SwingPlaybook';
import { AttackStatsAside } from '@/components/attacks/swing/AttackStatsAside';
import {
  AttackBlock,
  AttackHeading,
  AttackMain,
  AttackRow,
  KillingBlowBadge,
} from '@/components/attacks/swing/attackSwingRowStyles';
import { DicePoolStrip } from '@/components/attacks/swing/DicePoolStrip';
import { CornerBrackets } from '@/components/ui/CornerBrackets';
import { attackRowIsBerserker } from '@/core/attacks/attackRows';
import type { AttackBlockVariant } from '@/core/attacks/attackSequence.types';
import {
  attackBlockVariant,
  attackKindLabel,
} from '@/core/attacks/attackVariant';
import { maxNetSuccessesForRoll } from '@/core/damage/probability';
import {
  BONUS_TIME_MOMENTUM_COST,
  KILLING_BLOW_MOMENTUM,
  MIN_PLAYBOOK_NET,
} from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const CORNER_BRACKET_SIZE = 16;

const CORNER_ACCENTS: Partial<Record<AttackBlockVariant, string>> = {
  charge: 'var(--accent-charge)',
  berserker: 'var(--accent-berserker)',
};

export const AttackSwingRow = ({
  attack,
  displayIdx,
  disabled,
  isKillingBlow,
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
}: AttackSwingRowProps) => {
  const { attacker } = useMeatGrinderSimulation();
  const i = attack.attackIndex;
  const maxNet = maxNetSuccessesForRoll(attack.tac, armor);

  const hasWrapContinuation = wrapPicks[i].length > 1;
  const variant = attackBlockVariant(attacker, i, chargeAttackIndex);
  const cornerAccent = CORNER_ACCENTS[variant];
  const bonusTimeDisabled =
    !bonusTime && bonusTimeMomentumPool < BONUS_TIME_MOMENTUM_COST;

  const handleWrapToggle = () => {
    if (wrapOpen) {
      onWrapContinuationCleared(i);
    }

    onToggleWrapExpansion();
  };

  return (
    <AttackRow>
      <AttackMain>
        <AttackBlock $variant={variant} $disabled={disabled} inert={disabled}>
          {cornerAccent ? (
            <CornerBrackets accent={cornerAccent} size={CORNER_BRACKET_SIZE} />
          ) : null}
          <AttackHeading>
            {attackKindLabel(attacker, i, chargeAttackIndex)}
            {isKillingBlow ? (
              <KillingBlowBadge>
                Killing blow · +{KILLING_BLOW_MOMENTUM} MOM
              </KillingBlowBadge>
            ) : null}
          </AttackHeading>
          <DicePoolStrip
            attackIndex={i}
            tac={attack.tac}
            canCharge={charging && !attackRowIsBerserker(attacker, i)}
            isCharge={chargeAttackIndex === i}
            onCharge={() => onChargeAttackIndexChange(i)}
            bonusTime={bonusTime}
            bonusTimeDisabled={bonusTimeDisabled}
            onBonusTimeChange={(value) => onBonusTimeChange(i, value)}
            canWrap={hasWrapContinuation && maxNet >= MIN_PLAYBOOK_NET}
            wrapOpen={wrapOpen}
            onWrapToggle={handleWrapToggle}
          />
          <SwingPlaybook
            attack={attack}
            displayIdx={displayIdx}
            armor={armor}
            maxNet={maxNet}
            activeBaseCount={activeBaseCount}
            wrapPicks={wrapPicks}
            characterPlayPicks={characterPlayPicks}
            damageMods={damageMods}
            wrapOpen={wrapOpen}
            onChoiceChange={onChoiceChange}
            onCharacterPlayPickChange={onCharacterPlayPickChange}
          />
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
};
