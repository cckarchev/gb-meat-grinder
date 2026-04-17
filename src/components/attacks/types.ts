import type { AttackRollContext } from '../../core/attackSequence';
import type {
  GbFollowUp,
  GbFollowUpSlot,
  PlaybookChoiceId,
  WrapPick,
} from '../../core/playbook';

export type AttacksPanelProps = {
  targetHp: number;
  armor: number;
  chargeAttackIndex: number;
  onChargeAttackIndexChange: (index: number) => void;
  wrapPicks: WrapPick[][];
  gbFollowUps: GbFollowUpSlot[][];
  onChoiceChange: (
    attackIndex: number,
    pickIndex: number,
    id: PlaybookChoiceId | null,
  ) => void;
  onGbFollowUpChange: (
    attackIndex: number,
    pickIndex: number,
    follow: GbFollowUp,
  ) => void;
  onWrapContinuationCleared: (attackIndex: number) => void;
  attacks: AttackRollContext[];
};

export type GbSlotRef = { pid: PlaybookChoiceId; pickIndex: number };
