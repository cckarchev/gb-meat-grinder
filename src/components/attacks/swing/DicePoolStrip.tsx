import styles from '@/components/attacks/swing/DicePoolStrip.module.css';
import { WrapContinuationToggle } from '@/components/attacks/swing/WrapContinuationToggle';
import { TooltipCheckbox } from '@/components/ui/TooltipCheckbox';
import { Mono } from '@/components/ui/ui';
import {
  BONUS_TIME_MOMENTUM_COST,
  BONUS_TIME_TAC_BONUS,
  CHARGE_TAC_BONUS,
} from '@/core/shared/constants';

const BONUS_TIME_UNAFFORDABLE_TOOLTIP = `Bonus Time needs at least ${BONUS_TIME_MOMENTUM_COST} momentum before this attack (costs ${BONUS_TIME_MOMENTUM_COST} before the roll).`;

const BONUS_TIME_TOOLTIP = `Bonus Time: +${BONUS_TIME_TAC_BONUS} Dice Pool this attack; spend ${BONUS_TIME_MOMENTUM_COST} momentum before rolling.`;

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
  const bonusTimeTooltip = bonusTimeDisabled
    ? BONUS_TIME_UNAFFORDABLE_TOOLTIP
    : BONUS_TIME_TOOLTIP;

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: predates the CSS Modules move; giving the div a role changes the accessibility tree, so it is a separate fix.
    <div className={styles.bar} aria-label="Dice pool for this attack">
      <div className={styles.cluster}>
        {canCharge ? (
          <label className={styles.poolToggle}>
            <input
              type="radio"
              name="charge-attack"
              checked={isCharge}
              onChange={onCharge}
            />
            <span>+{CHARGE_TAC_BONUS} TAC charge</span>
          </label>
        ) : null}
        <TooltipCheckbox
          className={styles.poolToggle}
          checked={bonusTime}
          disabled={bonusTimeDisabled}
          onChange={onBonusTimeChange}
          tooltip={bonusTimeTooltip}
        >
          Bonus Time (+{BONUS_TIME_TAC_BONUS} Dice Pool)
        </TooltipCheckbox>
      </div>
      <div className={styles.readoutGroup}>
        {canWrap ? (
          <WrapContinuationToggle
            attackIndex={attackIndex}
            wrapOpen={wrapOpen}
            onClick={onWrapToggle}
          />
        ) : null}
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>Dice Pool</span>
          <Mono className={styles.readoutValue}>{tac}</Mono>
        </div>
      </div>
    </div>
  );
};
