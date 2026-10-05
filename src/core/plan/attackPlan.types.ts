import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import type {
  CharacterPlayPickSlot,
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

/** Inputs that bound a legal attack plan; see `clampAttackPlan`. */
export type AttackPlanClampParams = ActivationRollParams & {
  /** Target is already Knocked Down (disables the playbook KD). */
  enemyKnockedDown: boolean;
};
