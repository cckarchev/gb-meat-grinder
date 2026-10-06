import styles from '@/components/attacks/playbook/PlaybookColumnBlock.module.css';
import {
  PlaybookLineButton,
  type PlaybookLineLock,
} from '@/components/attacks/playbook/PlaybookLineButton';
import {
  probHeatBackground,
  probHeatBorder,
  probHeatTextColor,
} from '@/components/attacks/playbook/probStyle';
import type {
  PlaybookChoiceId,
  PlaybookResult,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { WrapSlotColumn } from '@/core/playbook/wrapSlots';
import { formatPercent } from '@/core/shared/format';
import type { CustomPropertyStyle } from '@/styles/customProperties';

const HIT_CHANCE_DIGITS = 1;

/** Heat colors for a column head, read by the CSS module. */
const columnHeadStyle = (hitChance: number): CustomPropertyStyle => {
  return {
    '--heat-background': probHeatBackground(hitChance),
    '--heat-text': probHeatTextColor(hitChance),
    '--heat-border': probHeatBorder(hitChance),
  };
};

type PlaybookColumnBlockProps = {
  attackIndex: number;
  slotColumn: WrapSlotColumn;
  /** The line this wrap slot currently picks, if any. */
  selectedId: WrapPick;
  lockFor: (result: PlaybookResult) => PlaybookLineLock | undefined;
  onPick: (id: PlaybookChoiceId) => void;
};

/** One reachable playbook column: its hit chance on top, its lines below. */
export const PlaybookColumnBlock = ({
  attackIndex,
  slotColumn,
  selectedId,
  lockFor,
  onPick,
}: PlaybookColumnBlockProps) => {
  const { column, hitChance } = slotColumn;
  const hitChanceLabel = formatPercent(hitChance, HIT_CHANCE_DIGITS);

  return (
    <div className={styles.columnBlock}>
      <div className={styles.columnHead} style={columnHeadStyle(hitChance)}>
        {hitChanceLabel}
      </div>
      <div className={styles.columnResults}>
        {column.results.map((result) => (
          <PlaybookLineButton
            key={result.id}
            attackIndex={attackIndex}
            id={result.id}
            selected={selectedId === result.id}
            lock={lockFor(result)}
            hitChanceLabel={hitChanceLabel}
            onClick={() => onPick(result.id)}
          />
        ))}
      </div>
    </div>
  );
};
