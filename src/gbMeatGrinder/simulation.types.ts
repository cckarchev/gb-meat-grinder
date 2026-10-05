import type { Dispatch } from 'react';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type {
  CharacterPlayPickSlot,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';

/** Editable state the components read as is. */
type ExposedState = Omit<
  MeatGrinderState,
  'attackerId' | 'attackPlan' | 'bonusTimeByAttack'
>;

/** React hook + context value for the Meat Grinder simulation. */
export type MeatGrinderSimulation = ExposedState & {
  /** The selected attacker model. */
  attacker: AttackerData;
  /** Every model that can be selected. */
  availableAttackers: readonly AttackerData[];
  /** Active base attacks this activation (derived from traits + influence). */
  activeBaseCount: number;
  /** Charge row the engine uses: `chargeAttackIndex` while charging, else -1. */
  effectiveChargeAttackIndex: number;
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
  /**
   * Wrap picks as the engine sees them once Resilience is applied: identical to
   * `wrapPicks` unless the target is Resilient, in which case the ignored first
   * swing's row is blanked. Use these for damage / momentum / odds math; use the
   * raw `wrapPicks` only to render each swing's chosen lines.
   */
  effectiveWrapPicks: WrapPick[][];
  /** Bonus-Time flags with the Resilience-ignored swing forced off. */
  effectiveBonusTimeByAttack: boolean[];
  /**
   * Display index into `attacks` of the swing ignored by Resilience (always 0
   * when active), or -1 when the target is not Resilient / has no attacks.
   */
  ignoredDisplayIndex: number;
  attacks: AttackRollContext[];
  /** Damage each attack row deals if every pick on it hits, by attack index. */
  rowDamageIfHit: number[];
  /** Guaranteed special-ability damage, applied before any swing. */
  flatDamage: number;
  /**
   * Display index into `attacks` of the swing that drops the target to 0 HP in
   * the deterministic all-hit projection, or -1 if it never falls. The
   * activation ends here: this swing earns +1 momentum (killing blow) and every
   * later swing can no longer be made.
   */
  killingBlowIndex: number;
  dispatch: Dispatch<MeatGrinderAction>;
};
