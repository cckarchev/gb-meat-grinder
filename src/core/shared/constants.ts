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

/** Momentum each momentous line that deals damage earns on a hit. */
export const MOMENTOUS_PICK_MOMENTUM = 1;

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

/** Damage Tough Hide removes from each playbook line with card damage. */
export const TOUGH_HIDE_DAMAGE_PENALTY = 1;

/** Most ARM a whole activation's playbook lines can strip. */
export const MAX_ARMOR_REDUCTION = 1;

/** Free base attacks a charge grants (also what Furious gets for free). */
export const CHARGE_ATTACK_COUNT = 1;

/** Free base attacks the Feral perk grants. */
export const FERAL_ATTACK_COUNT = 1;

/** Berserker rows reserved per base attack row. */
export const BERSERKER_ROWS_PER_BASE = 1;

/** Fewest wrap slots an attack shows, even when it cannot reach the playbook. */
export const MIN_WRAP_SLOTS = 1;
