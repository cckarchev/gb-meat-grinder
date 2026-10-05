import { AttackStatsAside } from '@/components/attacks/AttackStatsAside';
import {
  AttackBlock,
  AttackHeading,
  AttackMain,
  AttackRow,
  KillingBlowBadge,
} from '@/components/attacks/attackSwingRowStyles';
import { DicePoolStrip } from '@/components/attacks/DicePoolStrip';
import { SwingPlaybook } from '@/components/attacks/SwingPlaybook';
import { CornerBrackets } from '@/components/ui/CornerBrackets';
import { attackRowIsBerserker } from '@/core/attackRows';
import { attackBlockVariant, attackKindLabel } from '@/core/attackVariant';
import { KILLING_BLOW_MOMENTUM } from '@/core/constants';
import { maxNetSuccessesForRoll } from '@/core/probability';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import type { AttackSwingRowProps } from '@/types/components/attacks';
import type { AttackBlockVariant } from '@/types/core/attackSequence';

const CORNER_BRACKET_SIZE = 16;

const CORNER_ACCENTS: Partial<Record<AttackBlockVariant, string>> = {
  charge: 'var(--accent-charge)',
  berserker: 'var(--accent-berserker)',
};

export const AttackSwingRow = ({
  attack,
  displayIdx,
  disabled = false,
  isKillingBlow = false,
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
  const bonusTimeDisabled = !bonusTime && bonusTimeMomentumPool < 1;

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
            canWrap={hasWrapContinuation && maxNet >= 1}
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
