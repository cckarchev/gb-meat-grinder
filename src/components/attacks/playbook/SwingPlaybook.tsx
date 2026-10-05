import type { CharacterPlaySlotRef } from '@/components/attacks/attacks.types';
import {
  PlaybookPrimarySlot,
  UnreachableNote,
} from '@/components/attacks/playbook/swingPlaybookStyles';
import { WrapSlotPickGrid } from '@/components/attacks/playbook/WrapSlotPickGrid';
import { CharacterPlaySelection } from '@/components/attacks/plays/CharacterPlaySelection';
import { wrapSectionId, wrapTriggerId } from '@/components/attacks/wrapIds';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/playbookIndex';
import { rowHasWrapContinuation } from '@/core/playbook/wrapSlots';
import {
  FIRST_WRAP_PICK_INDEX,
  MIN_PLAYBOOK_NET,
  PRIMARY_PICK_INDEX,
} from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

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
      <UnreachableNote>
        No playbook column reachable: TAC − ARM is {maxNet}. Raise TAC (charge,
        Singled Out) or lower ARM.
      </UnreachableNote>
    );
  }

  const characterPlaySlots = rowPicks
    .map((choiceId, pickIndex) => ({ choiceId, pickIndex }))
    .filter(
      (slot): slot is CharacterPlaySlotRef =>
        slot.choiceId != null &&
        choiceUsesCharacterPlay(attacker, slot.choiceId),
    );

  const hasWrapContinuation = rowHasWrapContinuation(rowPicks);

  const renderSlot = (pickIndex: number, firstSlotInSection: boolean) => (
    <WrapSlotPickGrid
      key={pickIndex}
      attackIndex={attackIndex}
      pickIndex={pickIndex}
      tac={attack.tac}
      pHit={attack.pHit}
      armor={attack.armor}
      maxNet={maxNet}
      firstSlotInSection={firstSlotInSection}
    />
  );

  return (
    <>
      <PlaybookPrimarySlot>
        {renderSlot(PRIMARY_PICK_INDEX, true)}
      </PlaybookPrimarySlot>
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
        slots={characterPlaySlots}
        attackIndex={attackIndex}
        displayIndex={displayIndex}
      />
    </>
  );
};
