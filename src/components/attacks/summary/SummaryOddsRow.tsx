import {
  SelectionLine,
  SelectionPicksInline,
  SummaryRow,
} from '@/components/attacks/summary/attacksSummaryStyles';
import { Mono } from '@/components/ui/ui';
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
  } = useMeatGrinderSimulation();

  const rowPicks = effectiveWrapPicks[attackIndex];

  const probLabel = rowHasWrapPick(rowPicks)
    ? formatPercent(prob)
    : EMPTY_VALUE_LABEL;

  return (
    <SummaryRow>
      <SelectionLine>
        <Mono>{attackOrdinal(displayIndex)}</Mono>.{' '}
        {attackKindLabel(attacker, attackIndex, effectiveChargeAttackIndex)}
        {' -> '}
        <SelectionPicksInline>
          {formatWrapRowSelectionLabel(attacker, rowPicks ?? [], damageMods)}
        </SelectionPicksInline>
      </SelectionLine>
      <Mono>{probLabel}</Mono>
    </SummaryRow>
  );
};
