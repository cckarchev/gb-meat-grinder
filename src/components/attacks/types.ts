import type { AttackRollContext } from '../../core/attackSequence';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '../../core/playbook';

export type AttacksPanelProps = {
  targetHp: number;
  armor: number;
  chargeAttackIndex: number;
  onChargeAttackIndexChange: (index: number) => void;
  /** Momentum at the start of the activation (clamped 0–20 in the target panel). */
  startingMomentum: number;
  bonusTimeByAttack: boolean[];
  onBonusTimeChange: (attackIndex: number, value: boolean) => void;
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
  damageMods: PlaybookDamageMods;
  onChoiceChange: (
    attackIndex: number,
    pickIndex: number,
    id: PlaybookChoiceId | null,
  ) => void;
  onCharacterPlayPickChange: (
    attackIndex: number,
    pickIndex: number,
    pick: CharacterPlayPick,
  ) => void;
  onWrapContinuationCleared: (attackIndex: number) => void;
  attacks: AttackRollContext[];
};

export type CharacterPlaySlotRef = { pid: PlaybookChoiceId; pickIndex: number };
