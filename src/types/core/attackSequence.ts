/** Per-swing attack roll context produced by `computeAttackSequence`. */

export type AttackRollContext = {
  attackIndex: number;
  tac: number;
  defMinRoll: number;
  pHit: number;
  netSuccessesNeeded: number;
  prob: number;
};
