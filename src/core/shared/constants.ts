/** TAC Bonus Time adds to its attack; it costs `BONUS_TIME_MOMENTUM_COST` before the roll. */
export const BONUS_TIME_TAC_BONUS = 1;

export const DEF_MIN = 2;
export const DEF_MAX = 6;

export const ARM_MIN = 0;
export const ARM_MAX = 6;

export const HP_MIN = 1;
export const HP_MAX = 30;
export const HP_DEFAULT = 14;

/** Enemy stats a fresh calculator starts with. */
export const DEF_DEFAULT = 4;
export const ARM_DEFAULT = 1;

/** Momentum gained for taking the target out (killing blow). */
export const KILLING_BLOW_MOMENTUM = 1;

/**
 * Momentum each momentous result that earns it (see `pickGeneratesMomentum`)
 * gives on a hit.
 */
export const MOMENTOUS_PICK_MOMENTUM = 1;

/** Least influence a model can be allocated; the most is its INF. */
export const INFLUENCE_MIN = 0;

/** Influence a non-Furious model spends to charge. */
export const CHARGE_INFLUENCE_COST = 2;

/** Fewest net successes that reach a playbook column (and so open a wrap). */
export const MIN_PLAYBOOK_NET = 1;

/** Sentinel for "no attack": no charge row, no killing blow, no ignored swing. */
export const NO_ATTACK_INDEX = -1;

/** Momentum Bonus Time spends before the roll. */
export const BONUS_TIME_MOMENTUM_COST = 1;

/** DEF the target gains on the charge attack while in Defensive Stance. */
export const DEFENSIVE_STANCE_DEF_BONUS = 1;

/** TAC an attack loses while the target is still in cover. */
export const COVER_TAC_PENALTY = 1;

/** DEF a Knocked Down target loses. */
export const KNOCKED_DOWN_DEF_PENALTY = 1;

/** DEF a Snared target loses. */
export const SNARED_DEF_PENALTY = 1;

/** +TAC Assist gives while a named friendly model engages the target. */
export const ASSIST_TAC_BONUS = 1;

/** +DMG to playbook damage results Assist gives while a named model engages the target. */
export const ASSIST_DAMAGE_BONUS = 1;

/** Damage Tough Hide removes from each playbook line with card damage. */
export const TOUGH_HIDE_DAMAGE_PENALTY = 1;

/** Effect name every playbook Knock Down shares, so only one ever applies. */
export const KNOCKED_DOWN_EFFECT = 'knockedDown';

/** TAC a swing gains for being the charge. */
export const CHARGE_TAC_BONUS = 4;

/** Free base attacks a charge grants (also what Furious gets for free). */
export const CHARGE_ATTACK_COUNT = 1;

/** Free base attacks the Feral perk grants. */
export const FERAL_ATTACK_COUNT = 1;

/** Berserker rows reserved per base attack row. */
export const BERSERKER_ROWS_PER_BASE = 1;

/** Fewest wrap slots an attack shows, even when it cannot reach the playbook. */
export const MIN_WRAP_SLOTS = 1;

/** A swing's primary wrap slot: the pick every attack makes first. */
export const PRIMARY_PICK_INDEX = 0;

/** The first extra slot a wrap opens, right after the primary pick. */
export const FIRST_WRAP_PICK_INDEX = PRIMARY_PICK_INDEX + 1;
