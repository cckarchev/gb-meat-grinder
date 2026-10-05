import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';

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

export type AttackSwingRowProps = {
  attack: AttackRollContext;
  displayIdx: number;
  disabled?: boolean;
  isKillingBlow?: boolean;
  armor: number;
  charging: boolean;
  chargeAttackIndex: number;
  activeBaseCount: number;
  wrapPicks: AttacksPanelProps['wrapPicks'];
  characterPlayPicks: AttacksPanelProps['characterPlayPicks'];
  damageMods: AttacksPanelProps['damageMods'];
  remainingHpIfHit: number;
  momentum: number;
  bonusTime: boolean;
  bonusTimeMomentumPool: number;
  onBonusTimeChange: AttacksPanelProps['onBonusTimeChange'];
  wrapOpen: boolean;
  onChargeAttackIndexChange: AttacksPanelProps['onChargeAttackIndexChange'];
  onChoiceChange: AttacksPanelProps['onChoiceChange'];
  onCharacterPlayPickChange: AttacksPanelProps['onCharacterPlayPickChange'];
  onToggleWrapExpansion: () => void;
  onWrapContinuationCleared: AttacksPanelProps['onWrapContinuationCleared'];
};
