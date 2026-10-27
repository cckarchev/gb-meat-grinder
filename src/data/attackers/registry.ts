import type { AttackerData } from "./attacker.types";
import { bucker } from "./bucker";
import { cast } from "./cast";
import { crossCut } from "./crossCut";
import { thresher } from "./thresher";
import { veteranBoar } from "./veteranBoar";
import { veteranCinder } from "./veteranCinder";
import { windle } from "./windle";

/** Every model the calculator can simulate, in display order. */
export const ATTACKERS: readonly AttackerData[] = [
  veteranBoar,
  windle,
  thresher,
  cast,
  veteranCinder,
  crossCut,
  bucker,
];

/** Fallback model when an id can't be resolved. */
export const DEFAULT_ATTACKER: AttackerData = veteranBoar;

/** The registered model with this id, if any. */
export const findAttackerById = (id: string | null): AttackerData | undefined =>
  ATTACKERS.find((attacker) => attacker.id === id);

export const attackerById = (id: string): AttackerData =>
  findAttackerById(id) ?? DEFAULT_ATTACKER;

/** A random model, used to pick which one is selected on first load. */
export const randomAttacker = (): AttackerData =>
  ATTACKERS[Math.floor(Math.random() * ATTACKERS.length)];
