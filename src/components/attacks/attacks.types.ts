import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';

export type SwingPlanBindings = {
  onChargeAttackIndexChange: (index: number) => void;
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
};

export type CharacterPlaySlotRef = { pid: PlaybookChoiceId; pickIndex: number };

export type AttackSwingRowProps = {
  attack: AttackRollContext;
  displayIdx: number;
  disabled: boolean;
  isKillingBlow: boolean;
  charging: boolean;
  chargeAttackIndex: number;
  activeBaseCount: number;
  wrapPicks: SwingPlanBindings['wrapPicks'];
  characterPlayPicks: SwingPlanBindings['characterPlayPicks'];
  damageMods: SwingPlanBindings['damageMods'];
  remainingHpIfHit: number;
  momentum: number;
  bonusTime: boolean;
  bonusTimeMomentumPool: number;
  onBonusTimeChange: SwingPlanBindings['onBonusTimeChange'];
  wrapOpen: boolean;
  onChargeAttackIndexChange: SwingPlanBindings['onChargeAttackIndexChange'];
  onChoiceChange: SwingPlanBindings['onChoiceChange'];
  onCharacterPlayPickChange: SwingPlanBindings['onCharacterPlayPickChange'];
  onToggleWrapExpansion: () => void;
  onWrapContinuationCleared: SwingPlanBindings['onWrapContinuationCleared'];
};
