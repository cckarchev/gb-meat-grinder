import { WrapContinuationToggle } from '@/components/attacks/playbook/WrapContinuationToggle';
import {
  DicePoolBar,
  PoolCluster,
  PoolToggle,
  TacPoolBadge,
  TacPoolLabel,
  TacPoolRight,
  TacPoolValue,
} from '@/components/attacks/swing/dicePoolStyles';
import { InfoTip } from '@/components/ui/InfoTip';
import { CHARGE_TAC_BONUS } from '@/core/attacks/swingModifiers';

const BONUS_TIME_UNAFFORDABLE_TOOLTIP =
  'Bonus Time needs at least 1 momentum before this attack (costs 1 before the roll).';

const BONUS_TIME_TOOLTIP =
  'Bonus Time: +1 Dice Pool this attack; spend 1 momentum before rolling.';

type DicePoolStripProps = {
  attackIndex: number;
  tac: number;
  /** Show the charge radio for this swing (charging, and not a berserker row). */
  canCharge: boolean;
  isCharge: boolean;
  onCharge: () => void;
  bonusTime: boolean;
  bonusTimeDisabled: boolean;
  onBonusTimeChange: (value: boolean) => void;
  /** Show the wrap expand / collapse toggle. */
  canWrap: boolean;
  wrapOpen: boolean;
  onWrapToggle: () => void;
};

/** The swing's dice pool with the toggles that change it. */
export const DicePoolStrip = ({
  attackIndex,
  tac,
  canCharge,
  isCharge,
  onCharge,
  bonusTime,
  bonusTimeDisabled,
  onBonusTimeChange,
  canWrap,
  wrapOpen,
  onWrapToggle,
}: DicePoolStripProps) => {
  return (
    <DicePoolBar aria-label="Dice pool for this attack">
      <PoolCluster>
        {canCharge ? (
          <PoolToggle>
            <input
              type="radio"
              name="charge-attack"
              checked={isCharge}
              onChange={onCharge}
            />
            <span>+{CHARGE_TAC_BONUS} TAC charge</span>
          </PoolToggle>
        ) : null}
        <PoolToggle $disabled={bonusTimeDisabled}>
          <input
            type="checkbox"
            checked={bonusTime}
            disabled={bonusTimeDisabled}
            onChange={(e) => onBonusTimeChange(e.target.checked)}
          />
          <InfoTip
            content={
              bonusTimeDisabled
                ? BONUS_TIME_UNAFFORDABLE_TOOLTIP
                : BONUS_TIME_TOOLTIP
            }
          >
            Bonus Time (+1 Dice Pool)
          </InfoTip>
        </PoolToggle>
      </PoolCluster>
      <TacPoolRight>
        {canWrap ? (
          <WrapContinuationToggle
            attackIndex={attackIndex}
            wrapOpen={wrapOpen}
            onClick={onWrapToggle}
          />
        ) : null}
        <TacPoolBadge>
          <TacPoolLabel>Dice Pool</TacPoolLabel>
          <TacPoolValue>{tac}</TacPoolValue>
        </TacPoolBadge>
      </TacPoolRight>
    </DicePoolBar>
  );
};
