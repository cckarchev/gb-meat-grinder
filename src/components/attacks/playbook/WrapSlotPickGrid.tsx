import { PlaybookLineButton } from '@/components/attacks/playbook/PlaybookLineButton';
import {
  ColumnBlock,
  ColumnGrid,
  ColumnHead,
  ColumnResults,
  WrapSlotBlock,
} from '@/components/attacks/playbook/playbookGridStyles';
import { formatPercent, probAttackSucceeds } from '@/core/damage/probability';
import { knockDownTakenBeforePick } from '@/core/playbook/knockDown';
import {
  wrapExtendedNetNeeded,
  wrapSlotBudget,
} from '@/core/playbook/wrapSlots';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

const HIT_CHANCE_DIGITS = 1;

type WrapSlotPickGridProps = {
  attackIndex: number;
  pickIndex: number;
  tac: number;
  pHit: number;
  armor: number;
  maxNet: number;
  firstSlotInSection: boolean;
};

/** The playbook columns one wrap slot can reach, with their hit chances. */
export const WrapSlotPickGrid = ({
  attackIndex,
  pickIndex,
  tac,
  pHit,
  armor,
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

  const budget = wrapSlotBudget(attacker, maxNet, pickIndex);

  const visibleColumns = attacker.playbook.filter(
    (column) => column.netSuccesses <= budget,
  );

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
        {visibleColumns.map((column) => {
          const netForHeat = wrapExtendedNetNeeded(
            attacker,
            pickIndex,
            column.netSuccesses,
          );

          const columnHitChance = probAttackSucceeds(
            tac,
            pHit,
            armor,
            netForHeat,
          );
          const hitChanceLabel = formatPercent(
            columnHitChance,
            HIT_CHANCE_DIGITS,
          );

          return (
            <ColumnBlock key={column.netSuccesses}>
              <ColumnHead $p={columnHitChance}>{hitChanceLabel}</ColumnHead>
              <ColumnResults>
                {column.results.map((result) => {
                  const selected =
                    wrapPicks[attackIndex][pickIndex] === result.id;

                  // Wrap slots can be cleared by clicking the pick again; the
                  // first slot always keeps a line.
                  const clearsPick = pickIndex > 0 && selected;

                  return (
                    <PlaybookLineButton
                      key={result.id}
                      id={result.id}
                      selected={selected}
                      kdLocked={
                        result.appliesKnockDown === true && knockDownTaken
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
