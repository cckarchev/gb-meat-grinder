import styles from '@/components/attacks/summary/attacksSummary.module.css';
import { Mono } from '@/components/ui/ui';
import { swingDamageMods } from '@/core/attacks/activationTimeline';
import { attackKindLabel } from '@/core/attacks/attackKind';
import { formatWrapRowSelectionLabel } from '@/core/playbook/playbookLabels';
import { rowHasWrapPick } from '@/core/playbook/wrapSlots';
import {
  attackOrdinal,
  EMPTY_VALUE_LABEL,
  formatPercent,
} from '@/core/shared/format';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

type SummaryOddsRowProps = {
  attackIndex: number;
  displayIndex: number;
  /** Chance the swing reaches its picked lines. */
  prob: number;
};

/** One swing's picks and the chance it lands them. */
export const SummaryOddsRow = ({
  attackIndex,
  displayIndex,
  prob,
}: SummaryOddsRowProps) => {
  const {
    attacker,
    damageMods,
    effectiveWrapPicks,
    effectiveChargeAttackIndex,
    timeline,
  } = useMeatGrinderSimulation();

  const rowPicks = effectiveWrapPicks[attackIndex];
  const swingMods = swingDamageMods(damageMods, timeline, attackIndex);

  const probLabel = rowHasWrapPick(rowPicks)
    ? formatPercent(prob)
    : EMPTY_VALUE_LABEL;

  return (
    <div className={styles.summaryRow}>
      <span className={styles.selectionLine}>
        <Mono>{attackOrdinal(displayIndex)}</Mono>.{' '}
        {attackKindLabel(attacker, attackIndex, effectiveChargeAttackIndex)}
        {' -> '}
        <span className={styles.selectionPicksInline}>
          {formatWrapRowSelectionLabel(attacker, rowPicks ?? [], swingMods)}
        </span>
      </span>
      <Mono>{probLabel}</Mono>
    </div>
  );
};
