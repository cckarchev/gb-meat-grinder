import type { AttackRollContext } from "@/core/attacks/attackSequence.types";
import { characterPlayPickIndexes } from "@/core/character-plays/characterPlayLookup";
import { rowHasWrapContinuation } from "@/core/playbook/wrapSlots";
import {
  FIRST_WRAP_PICK_INDEX,
  MIN_PLAYBOOK_NET,
  PRIMARY_PICK_INDEX,
} from "@/core/shared/constants";
import { useMeatGrinderSimulation } from "@/meat-grinder/useMeatGrinderSimulation";
import { wrapSectionId, wrapTriggerId } from "../wrapIds";
import { CharacterPlaySelection } from "./character-play-selection/CharacterPlaySelection";
import styles from "./SwingPlaybook.module.css";
import { WrapSlotPickGrid } from "./wrap-slot-pick-grid/WrapSlotPickGrid";

type SwingPlaybookProps = {
  attack: AttackRollContext;
  displayIndex: number;
  maxNet: number;
  wrapOpen: boolean;
};

/** The swing's playbook picks: first slot, wrap slots and character plays. */
export const SwingPlaybook = ({
  attack,
  displayIndex,
  maxNet,
  wrapOpen,
}: SwingPlaybookProps) => {
  const { attacker, wrapPicks } = useMeatGrinderSimulation();
  const attackIndex = attack.attackIndex;
  const rowPicks = wrapPicks[attackIndex];

  if (maxNet < MIN_PLAYBOOK_NET) {
    return (
      <p className={styles.unreachableNote}>
        No playbook column reachable: TAC - ARM is {maxNet}. Raise TAC (charge,
        Singled Out) or lower ARM.
      </p>
    );
  }

  const characterPlayIndexes = characterPlayPickIndexes(attacker, rowPicks);

  const hasWrapContinuation = rowHasWrapContinuation(rowPicks);

  const renderSlot = (pickIndex: number, firstSlotInSection: boolean) => (
    <WrapSlotPickGrid
      key={pickIndex}
      attackIndex={attackIndex}
      pickIndex={pickIndex}
      roll={attack}
      maxNet={maxNet}
      firstSlotInSection={firstSlotInSection}
    />
  );

  return (
    <>
      {renderSlot(PRIMARY_PICK_INDEX, true)}
      {hasWrapContinuation ? (
        <section
          id={wrapSectionId(attackIndex)}
          aria-labelledby={wrapTriggerId(attackIndex)}
          hidden={!wrapOpen}
        >
          {rowPicks.slice(FIRST_WRAP_PICK_INDEX).map((_, slot) => {
            const pickIndex = FIRST_WRAP_PICK_INDEX + slot;

            return renderSlot(pickIndex, pickIndex === FIRST_WRAP_PICK_INDEX);
          })}
        </section>
      ) : null}
      <CharacterPlaySelection
        pickIndexes={characterPlayIndexes}
        attackIndex={attackIndex}
        displayIndex={displayIndex}
      />
    </>
  );
};
