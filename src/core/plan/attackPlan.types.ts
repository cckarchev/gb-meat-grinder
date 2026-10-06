import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  WrapPick,
} from '@/core/playbook/playbook.types';

export type AttackPlan = {
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
};

/** One attack's wrap picks with the character-play slot for each pick. */
export type AttackPlanRow = {
  picks: WrapPick[];
  plays: CharacterPlayPickSlot[];
};

/** One wrap slot of one attack. */
export type PickPosition = {
  attackIndex: number;
  pickIndex: number;
};

/** A playbook line chosen (or cleared, with `null`) for one wrap slot of one attack. */
export type WrapChoiceEdit = PickPosition & {
  id: PlaybookChoiceId | null;
};

/** A character play chosen for one wrap slot of one attack. */
export type CharacterPlayPickEdit = PickPosition & {
  pick: CharacterPlayPick;
};

/** Inputs that bound a legal attack plan; see `clampAttackPlan`. */
export type AttackPlanClampParams = ActivationRollParams;
