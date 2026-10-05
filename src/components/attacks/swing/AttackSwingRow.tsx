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
import { canAffordBonusTime } from '@/core/activation/bonusTimeFlags';
import { attackKind, attackKindLabel } from '@/core/attacks/attackKind';
import { attackRowIsBerserker } from '@/core/attacks/attackRows';
import type {
  AttackKind,
  AttackRollContext,
} from '@/core/attacks/attackSequence.types';
import { maxNetSuccessesForRoll } from '@/core/damage/probability';
import { rowHasWrapContinuation } from '@/core/playbook/wrapSlots';
import {
  KILLING_BLOW_MOMENTUM,
  MIN_PLAYBOOK_NET,
} from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const CORNER_BRACKET_SIZE = 16;

const CORNER_ACCENTS: Partial<Record<AttackKind, string>> = {
  charge: 'var(--accent-charge)',
  berserker: 'var(--accent-berserker)',
};

/** Per-swing values only `AttacksPanel` knows; shared plan state comes from context. */
type AttackSwingRowProps = {
  attack: AttackRollContext;
  displayIndex: number;
  disabled: boolean;
  isKillingBlow: boolean;
  /** Charge row the engine uses: the chosen base, or none when not charging. */
  chargeAttackIndex: number;
  remainingHpIfHit: number;
  momentum: number;
  bonusTime: boolean;
  bonusTimeMomentumPool: number;
  wrapOpen: boolean;
  onToggleWrapExpansion: () => void;
};

export const AttackSwingRow = ({
  attack,
  displayIndex,
  disabled,
  isKillingBlow,
  chargeAttackIndex,
  remainingHpIfHit,
  momentum,
  bonusTime,
  bonusTimeMomentumPool,
  wrapOpen,
  onToggleWrapExpansion,
}: AttackSwingRowProps) => {
  const { attacker, charging, wrapPicks, dispatch } =
    useMeatGrinderSimulation();
  const attackIndex = attack.attackIndex;
  const armor = attack.armor;
  const maxNet = maxNetSuccessesForRoll(attack.tac, armor);

  const hasWrapContinuation = rowHasWrapContinuation(wrapPicks[attackIndex]);
  const variant = attackKind(attacker, attackIndex, chargeAttackIndex);
  const cornerAccent = CORNER_ACCENTS[variant];
  const bonusTimeDisabled =
    !bonusTime && !canAffordBonusTime(bonusTimeMomentumPool);

  const handleWrapToggle = () => {
    if (wrapOpen) {
      dispatch({ type: 'clearWrapContinuation', attackIndex });
    }

    onToggleWrapExpansion();
  };

  const handleCharge = () => {
    dispatch({ type: 'chargeAttackIndex', value: attackIndex });
  };

  const handleBonusTimeChange = (value: boolean) => {
    dispatch({ type: 'bonusTime', attackIndex, value });
  };

  return (
    <AttackRow>
      <AttackMain>
        <AttackBlock $variant={variant} $disabled={disabled} inert={disabled}>
          {cornerAccent ? (
            <CornerBrackets accent={cornerAccent} size={CORNER_BRACKET_SIZE} />
          ) : null}
          <AttackHeading>
            {attackKindLabel(attacker, attackIndex, chargeAttackIndex)}
            {isKillingBlow ? (
              <KillingBlowBadge>
                Killing blow · +{KILLING_BLOW_MOMENTUM} MOM
              </KillingBlowBadge>
            ) : null}
          </AttackHeading>
          <DicePoolStrip
            attackIndex={attackIndex}
            tac={attack.tac}
            canCharge={charging && !attackRowIsBerserker(attacker, attackIndex)}
            isCharge={chargeAttackIndex === attackIndex}
            onCharge={handleCharge}
            bonusTime={bonusTime}
            bonusTimeDisabled={bonusTimeDisabled}
            onBonusTimeChange={handleBonusTimeChange}
            canWrap={hasWrapContinuation && maxNet >= MIN_PLAYBOOK_NET}
            wrapOpen={wrapOpen}
            onWrapToggle={handleWrapToggle}
          />
          <SwingPlaybook
            attack={attack}
            displayIndex={displayIndex}
            maxNet={maxNet}
            wrapOpen={wrapOpen}
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
