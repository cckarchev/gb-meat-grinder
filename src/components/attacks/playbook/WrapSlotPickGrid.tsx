import { PlaybookColumnBlock } from '@/components/attacks/playbook/PlaybookColumnBlock';
import type { PlaybookLineLock } from '@/components/attacks/playbook/PlaybookLineButton';
import styles from '@/components/attacks/playbook/WrapSlotPickGrid.module.css';
import {
  knockDownIsOnlyEffect,
  knockDownTakenBeforePick,
} from '@/core/playbook/knockDown';
import { stealsBall } from '@/core/playbook/oncePerActivation';
import type {
  PlaybookChoiceId,
  PlaybookResult,
} from '@/core/playbook/playbook.types';
import { tackleTakenBeforePick } from '@/core/playbook/tackle';
import { type SwingRoll, wrapSlotColumns } from '@/core/playbook/wrapSlots';
import { PRIMARY_PICK_INDEX } from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import type { CustomPropertyStyle } from '@/styles/customProperties';
import { dataFlag } from '@/styles/dataFlag';

/** Keeps the grid one track wide even when no column is reachable. */
const MIN_COLUMN_COUNT = 1;

type WrapSlotPickGridProps = {
  attackIndex: number;
  pickIndex: number;
  roll: SwingRoll;
  maxNet: number;
  firstSlotInSection: boolean;
};

/** The playbook columns one wrap slot can reach, with their hit chances. */
export const WrapSlotPickGrid = ({
  attackIndex,
  pickIndex,
  roll,
  maxNet,
  firstSlotInSection,
}: WrapSlotPickGridProps) => {
  const {
    attacker,
    enemyKnockedDown,
    wrapPicks,
    damageMods,
    activeBaseCount,
    dispatch,
  } = useMeatGrinderSimulation();

  const selectedId = wrapPicks[attackIndex][pickIndex];
  const visibleColumns = wrapSlotColumns(attacker, roll, maxNet, pickIndex);

  const order = { attacker, damageMods, activeBaseCount };
  const position = { attackIndex, pickIndex };

  const knockDownTaken = knockDownTakenBeforePick(
    order,
    wrapPicks,
    position,
    enemyKnockedDown,
  );

  const tackleTaken = tackleTakenBeforePick(order, wrapPicks, position);

  const lockFor = (result: PlaybookResult): PlaybookLineLock | undefined => {
    if (knockDownTaken && knockDownIsOnlyEffect(result)) {
      return 'knockDown';
    }

    if (tackleTaken && stealsBall(result)) {
      return 'tackle';
    }

    return undefined;
  };

  const handlePick = (id: PlaybookChoiceId) => {
    // Wrap slots can be cleared by clicking the pick again; the first slot
    // always keeps a line.
    const reselected = selectedId === id;
    const clearsPick = pickIndex !== PRIMARY_PICK_INDEX && reselected;

    dispatch({
      type: 'wrapChoice',
      attackIndex,
      pickIndex,
      id: clearsPick ? null : id,
    });
  };

  const columnCount = Math.max(MIN_COLUMN_COUNT, visibleColumns.length);
  const gridStyle: CustomPropertyStyle = { '--column-count': columnCount };

  return (
    <div
      className={styles.wrapSlotBlock}
      data-first={dataFlag(firstSlotInSection)}
    >
      <div className={styles.columnGrid} style={gridStyle}>
        {visibleColumns.map((slotColumn) => (
          <PlaybookColumnBlock
            key={slotColumn.column.netSuccesses}
            attackIndex={attackIndex}
            slotColumn={slotColumn}
            selectedId={selectedId}
            lockFor={lockFor}
            onPick={handlePick}
          />
        ))}
      </div>
    </div>
  );
};
