import { veteranBoar } from '@/attackers/veteranBoar';
import type { AttackerData } from '@/types/core/attacker';

/**
 * The attacker the calculator currently models. Single seam so the engine and UI
 * read one source; swap this (later: a selector / context) for true multi-model.
 */
export const activeAttacker: AttackerData = veteranBoar;
