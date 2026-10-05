import { PlaybookLineButton } from '@/components/attacks/playbook/PlaybookLineButton';
import {
  ColumnBlock,
  ColumnGrid,
  ColumnHead,
  ColumnResults,
  WrapSlotBlock,
} from '@/components/attacks/playbook/playbookGridStyles';
import {
  knockDownIsOnlyEffect,
  knockDownTakenBeforePick,
} from '@/core/playbook/knockDown';
import { type SwingRoll, wrapSlotColumns } from '@/core/playbook/wrapSlots';
import { PRIMARY_PICK_INDEX } from '@/core/shared/constants';
import { formatPercent } from '@/core/shared/format';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const HIT_CHANCE_DIGITS = 1;

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

  return (
    <WrapSlotBlock $first={firstSlotInSection}>
      <ColumnGrid $columnCount={visibleColumns.length}>
        {visibleColumns.map(({ column, hitChance }) => {
          const hitChanceLabel = formatPercent(hitChance, HIT_CHANCE_DIGITS);

          return (
            <ColumnBlock key={column.netSuccesses}>
              <ColumnHead $hitChance={hitChance}>{hitChanceLabel}</ColumnHead>
              <ColumnResults>
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
              </ColumnResults>
            </ColumnBlock>
          );
        })}
      </ColumnGrid>
    </WrapSlotBlock>
  );
};
