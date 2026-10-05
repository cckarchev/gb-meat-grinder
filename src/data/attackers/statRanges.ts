import type { StatRange } from '@/data/attackers/attacker.types';

/**
 * Assumed caps, not card values: they keep each input within what can
 * plausibly happen in a real game, so the controls stay bounded.
 */

export const STARTING_MOMENTUM_RANGE: StatRange = { min: 0, max: 20 };

export const GANGING_UP_RANGE: StatRange = { min: 0, max: 5 };

export const CROWDING_OUT_RANGE: StatRange = { min: 0, max: 5 };
