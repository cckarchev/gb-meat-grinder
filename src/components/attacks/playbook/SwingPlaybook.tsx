import type {
  CharacterPlaySlotRef,
  SwingPlanBindings,
} from '@/components/attacks/attacks.types';
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
  armor: number;
  maxNet: number;
  activeBaseCount: number;
  wrapPicks: SwingPlanBindings['wrapPicks'];
  characterPlayPicks: SwingPlanBindings['characterPlayPicks'];
  damageMods: SwingPlanBindings['damageMods'];
  wrapOpen: boolean;
  onChoiceChange: SwingPlanBindings['onChoiceChange'];
  onCharacterPlayPickChange: SwingPlanBindings['onCharacterPlayPickChange'];
};

/** The swing's playbook picks: first slot, wrap slots and character plays. */
export const SwingPlaybook = ({
  attack,
  displayIdx,
  armor,
  maxNet,
  activeBaseCount,
  wrapPicks,
  characterPlayPicks,
  damageMods,
  wrapOpen,
  onChoiceChange,
  onCharacterPlayPickChange,
}: SwingPlaybookProps) => {
  const { attacker } = useMeatGrinderSimulation();
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

  const renderSlot = (pickIndex: number, firstSlotInSection: boolean) => {
    return (
      <WrapSlotPickGrid
        key={pickIndex}
        attackIndex={attackIndex}
        pickIndex={pickIndex}
        tac={attack.tac}
        pHit={attack.pHit}
        armor={armor}
        maxNet={maxNet}
        wrapPicks={wrapPicks}
        damageMods={damageMods}
        activeBaseCount={activeBaseCount}
        firstSlotInSection={firstSlotInSection}
        onChoiceChange={onChoiceChange}
      />
    );
  };

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
        wrapPicks={wrapPicks}
        characterPlayPicks={characterPlayPicks}
        damageMods={damageMods}
        attackIndex={attackIndex}
        displayIdx={displayIdx}
        activeBaseCount={activeBaseCount}
        onCharacterPlayPickChange={onCharacterPlayPickChange}
      />
    </>
  );
};
