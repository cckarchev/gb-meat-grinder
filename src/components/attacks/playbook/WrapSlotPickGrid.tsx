import { PlaybookLineButton } from '@/components/attacks/playbook/PlaybookLineButton';
import {
  probHeatBackground,
  probHeatBorder,
  probHeatTextColor,
} from '@/components/attacks/playbook/probStyle';
import styles from '@/components/attacks/playbook/WrapSlotPickGrid.module.css';
import {
  knockDownIsOnlyEffect,
  knockDownTakenBeforePick,
} from '@/core/playbook/knockDown';
import { type SwingRoll, wrapSlotColumns } from '@/core/playbook/wrapSlots';
import { PRIMARY_PICK_INDEX } from '@/core/shared/constants';
import { formatPercent } from '@/core/shared/format';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import type { CustomPropertyStyle } from '@/styles/customProperties';
import { dataFlag } from '@/styles/dataFlag';

const HIT_CHANCE_DIGITS = 1;

/** Keeps the grid one track wide even when no column is reachable. */
const MIN_COLUMN_COUNT = 1;

/** Heat colors for a column head, read by the CSS module. */
const columnHeadStyle = (hitChance: number): CustomPropertyStyle => {
  return {
    '--heat-background': probHeatBackground(hitChance),
    '--heat-text': probHeatTextColor(hitChance),
    '--heat-border': probHeatBorder(hitChance),
  };
};

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

  const knockDownTaken = knockDownTakenBeforePick(
    attacker,
    wrapPicks,
    attackIndex,
    pickIndex,
    damageMods,
    activeBaseCount,
    enemyKnockedDown,
  );

  const columnCount = Math.max(MIN_COLUMN_COUNT, visibleColumns.length);
  const gridStyle: CustomPropertyStyle = { '--column-count': columnCount };

  return (
    <div
      className={styles.wrapSlotBlock}
      data-first={dataFlag(firstSlotInSection)}
    >
      <div className={styles.columnGrid} style={gridStyle}>
        {visibleColumns.map(({ column, hitChance }) => {
          const hitChanceLabel = formatPercent(hitChance, HIT_CHANCE_DIGITS);

          return (
            <div className={styles.columnBlock} key={column.netSuccesses}>
              <div
                className={styles.columnHead}
                style={columnHeadStyle(hitChance)}
              >
                {hitChanceLabel}
              </div>
              <div className={styles.columnResults}>
                {column.results.map((result) => {
                  const selected = selectedId === result.id;

                  // Wrap slots can be cleared by clicking the pick again; the
                  // first slot always keeps a line.
                  const clearsPick =
                    pickIndex !== PRIMARY_PICK_INDEX && selected;

                  return (
                    <PlaybookLineButton
                      key={result.id}
                      id={result.id}
                      selected={selected}
                      knockDownLocked={
                        knockDownTaken && knockDownIsOnlyEffect(result)
                      }
                      hitChanceLabel={hitChanceLabel}
                      onClick={() =>
                        dispatch({
                          type: 'wrapChoice',
                          attackIndex,
                          pickIndex,
                          id: clearsPick ? null : result.id,
                        })
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
