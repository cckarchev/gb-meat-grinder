import type { AttacksPanelProps } from '@/components/attacks/attacks.types';
import { PlaybookLineButton } from '@/components/attacks/playbook/PlaybookLineButton';
import {
  ColumnBlock,
  ColumnGrid,
  ColumnHead,
  ColumnResults,
  WrapSlotBlock,
} from '@/components/attacks/playbook/playbookGridStyles';
import { formatPercent, probAttackSucceeds } from '@/core/damage/probability';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { kdAlreadyTakenBeforePick } from '@/core/playbook/rowEffects';
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
  wrapPicks: WrapPick[][];
  damageMods: PlaybookDamageMods;
  activeBaseCount: number;
  firstSlotInSection: boolean;
  onChoiceChange: AttacksPanelProps['onChoiceChange'];
};

/** The playbook columns one wrap slot can reach, with their hit chances. */
export const WrapSlotPickGrid = ({
  attackIndex,
  pickIndex,
  tac,
  pHit,
  armor,
  maxNet,
  wrapPicks,
  damageMods,
  activeBaseCount,
  firstSlotInSection,
  onChoiceChange,
}: WrapSlotPickGridProps) => {
  const { attacker, enemyKnockedDown } = useMeatGrinderSimulation();
  const i = attackIndex;
  const budget = wrapSlotBudget(attacker, maxNet, pickIndex);

  const visibleColumns = attacker.playbook.filter(
    (c) => c.netSuccesses <= budget,
  );

  const kdTaken = kdAlreadyTakenBeforePick(
    attacker,
    wrapPicks,
    i,
    pickIndex,
    damageMods,
    activeBaseCount,
    enemyKnockedDown,
  );

  return (
    <WrapSlotBlock $first={firstSlotInSection}>
      <ColumnGrid $columnCount={visibleColumns.length}>
        {visibleColumns.map((col) => {
          const netForHeat = wrapExtendedNetNeeded(
            attacker,
            pickIndex,
            col.netSuccesses,
          );

          const pCol = probAttackSucceeds(tac, pHit, armor, netForHeat);
          const hitChanceLabel = formatPercent(pCol, HIT_CHANCE_DIGITS);

          return (
            <ColumnBlock key={col.netSuccesses}>
              <ColumnHead $p={pCol}>{hitChanceLabel}</ColumnHead>
              <ColumnResults>
                {col.results.map((result) => {
                  const selected = wrapPicks[i][pickIndex] === result.id;

                  // Wrap slots can be cleared by clicking the pick again; the
                  // first slot always keeps a line.
                  const clearsPick = pickIndex > 0 && selected;

                  return (
                    <PlaybookLineButton
                      key={result.id}
                      id={result.id}
                      damageMods={damageMods}
                      selected={selected}
                      kdLocked={result.appliesKnockDown === true && kdTaken}
                      hitChanceLabel={hitChanceLabel}
                      onClick={() =>
                        onChoiceChange(
                          i,
                          pickIndex,
                          clearsPick ? null : result.id,
                        )
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
