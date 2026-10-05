import {
  PlaybookPrimarySlot,
  UnreachableNote,
} from '@/components/attacks/attackSwingRowStyles';
import { CharacterPlaySelection } from '@/components/attacks/CharacterPlaySelection';
import { WrapSlotPickGrid } from '@/components/attacks/WrapSlotPickGrid';
import { MIN_PLAYBOOK_NET } from '@/core/constants';
import { choiceUsesCharacterPlay } from '@/core/wrapSlots';
import { useMeatGrinderSimulation } from '@/gbMeatGrinder/useMeatGrinderSimulation';
import type {
  AttacksPanelProps,
  CharacterPlaySlotRef,
} from '@/types/components/attacks';
import type { AttackRollContext } from '@/types/core/attackSequence';

type SwingPlaybookProps = {
  attack: AttackRollContext;
  displayIdx: number;
  armor: number;
  maxNet: number;
  activeBaseCount: number;
  wrapPicks: AttacksPanelProps['wrapPicks'];
  characterPlayPicks: AttacksPanelProps['characterPlayPicks'];
  damageMods: AttacksPanelProps['damageMods'];
  wrapOpen: boolean;
  onChoiceChange: AttacksPanelProps['onChoiceChange'];
  onCharacterPlayPickChange: AttacksPanelProps['onCharacterPlayPickChange'];
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
  const i = attack.attackIndex;
  const rowPicks = wrapPicks[i];

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
        attackIndex={i}
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
          id={`attack-wrap-${i}`}
          aria-labelledby={`attack-wrap-trigger-${i}`}
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
        attackIndex={i}
        displayIdx={displayIdx}
        activeBaseCount={activeBaseCount}
        onCharacterPlayPickChange={onCharacterPlayPickChange}
      />
    </>
  );
};
