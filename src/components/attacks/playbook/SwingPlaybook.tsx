import type { CharacterPlaySlotRef } from '@/components/attacks/attacks.types';
import { WrapSlotPickGrid } from '@/components/attacks/playbook/WrapSlotPickGrid';
import { CharacterPlaySelection } from '@/components/attacks/plays/CharacterPlaySelection';
import {
  PlaybookPrimarySlot,
  UnreachableNote,
} from '@/components/attacks/swing/attackSwingRowStyles';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/wrapSlots';
import { MIN_PLAYBOOK_NET } from '@/core/shared/constants';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';

type SwingPlaybookProps = {
  attack: AttackRollContext;
  displayIdx: number;
  maxNet: number;
  wrapOpen: boolean;
};

/** The swing's playbook picks: first slot, wrap slots and character plays. */
export const SwingPlaybook = ({
  attack,
  displayIdx,
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
    .map((pid, pickIndex) => ({ pid, pickIndex }))
    .filter(
      (x): x is CharacterPlaySlotRef =>
        x.pid != null && choiceUsesCharacterPlay(attacker, x.pid),
    );

  const hasWrapContinuation = rowPicks.length > 1;

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
      <PlaybookPrimarySlot>{renderSlot(0, true)}</PlaybookPrimarySlot>
      {hasWrapContinuation ? (
        <section
          id={`attack-wrap-${attackIndex}`}
          aria-labelledby={`attack-wrap-trigger-${attackIndex}`}
          hidden={!wrapOpen}
        >
          {rowPicks.slice(1).map((_, slot) => {
            const pickIndex = slot + 1;

            return renderSlot(pickIndex, pickIndex === 1);
          })}
        </section>
      ) : null}
      <CharacterPlaySelection
        slots={characterPlaySlots}
        attackIndex={attackIndex}
        displayIdx={displayIdx}
      />
    </>
  );
};
