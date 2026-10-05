import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

export type AttackPlan = {
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
};

/** One attack's wrap picks with the character-play slot for each pick. */
export type AttackPlanRow = {
  picks: WrapPick[];
  plays: CharacterPlayPickSlot[];
};

/** A playbook line chosen (or cleared, with `null`) for one wrap slot of one attack. */
export type WrapChoiceEdit = {
  attackIndex: number;
  pickIndex: number;
  id: PlaybookChoiceId | null;
};

/** A character play chosen for one wrap slot of one attack. */
export type CharacterPlayPickEdit = {
  attackIndex: number;
  pickIndex: number;
  pick: CharacterPlayPick;
};

/** What a character play edit needs to re-check the later plays. */
export type CharacterPlayEditParams = {
  attacker: AttackerData;
  damageMods: PlaybookDamageMods;
  activeBaseCount: number;
};

/** Inputs that bound a legal attack plan; see `clampAttackPlan`. */
export type AttackPlanClampParams = ActivationRollParams & {
  /** Target is already Knocked Down (disables the playbook KD). */
  enemyKnockedDown: boolean;
};
