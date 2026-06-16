/** Per-swing attack roll context produced by `computeAttackSequence`. */

export type AttackRollContext = {
  attackIndex: number;
  tac: number;
  /** Enemy ARM for this swing (guild buffs minus any earlier GB They Ain't Tough). */
  armor: number;
  defMinRoll: number;
  pHit: number;
  netSuccessesNeeded: number;
  prob: number;
};
