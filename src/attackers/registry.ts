import { thresher } from '@/attackers/thresher';
import { veteranBoar } from '@/attackers/veteranBoar';
import { windle } from '@/attackers/windle';
import type { AttackerData } from '@/types/core/attacker';

/** Every model the calculator can simulate, in display order. */
export const ATTACKERS: readonly AttackerData[] = [
  veteranBoar,
  windle,
  thresher,
];

/** Fallback model when an id can't be resolved. */
export const DEFAULT_ATTACKER: AttackerData = veteranBoar;

export function attackerById(id: string): AttackerData {
  return ATTACKERS.find((a) => a.id === id) ?? DEFAULT_ATTACKER;
}

/** A random model, used to pick which one is selected on first load. */
export function randomAttacker(): AttackerData {
  return ATTACKERS[Math.floor(Math.random() * ATTACKERS.length)];
}
