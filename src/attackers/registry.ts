import { veteranBoar } from '@/attackers/veteranBoar';
import { windle } from '@/attackers/windle';
import type { AttackerData } from '@/types/core/attacker';

/** Every model the calculator can simulate, in display order. */
export const ATTACKERS: readonly AttackerData[] = [veteranBoar, windle];

/** Model selected on first load. */
export const DEFAULT_ATTACKER: AttackerData = veteranBoar;

export function attackerById(id: string): AttackerData {
  return ATTACKERS.find((a) => a.id === id) ?? DEFAULT_ATTACKER;
}
