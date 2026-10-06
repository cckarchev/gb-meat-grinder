import type { AttackerData } from '@/data/attackers/attacker.types';
import { bucker } from '@/data/attackers/bucker';
import { cast } from '@/data/attackers/cast';
import { crossCut } from '@/data/attackers/crossCut';
import { thresher } from '@/data/attackers/thresher';
import { veteranBoar } from '@/data/attackers/veteranBoar';
import { veteranCinder } from '@/data/attackers/veteranCinder';
import { windle } from '@/data/attackers/windle';

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

export const attackerById = (id: string): AttackerData => {
  return ATTACKERS.find((attacker) => attacker.id === id) ?? DEFAULT_ATTACKER;
};

/** A random model, used to pick which one is selected on first load. */
export const randomAttacker = (): AttackerData => {
  return ATTACKERS[Math.floor(Math.random() * ATTACKERS.length)];
};
