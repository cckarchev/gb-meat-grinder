import styles from '@/components/attacks/swing/AttackHeading.module.css';
import { attackKindLabel } from '@/core/attacks/attackKind';
import { KILLING_BLOW_MOMENTUM } from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

type AttackHeadingProps = {
  attackIndex: number;
  /** Charge row the engine uses: the chosen base, or none when not charging. */
  chargeAttackIndex: number;
  isKillingBlow: boolean;
};

/** The swing's kind label, plus a badge when it is the killing blow. */
export const AttackHeading = ({
  attackIndex,
  chargeAttackIndex,
  isKillingBlow,
}: AttackHeadingProps) => {
  const { attacker } = useMeatGrinderSimulation();

  return (
    <div className={styles.attackHeading}>
      {attackKindLabel(attacker, attackIndex, chargeAttackIndex)}
      {isKillingBlow ? (
        <span className={styles.killingBlowBadge}>
          Killing blow · +{KILLING_BLOW_MOMENTUM} MOM
        </span>
      ) : null}
    </div>
  );
};
