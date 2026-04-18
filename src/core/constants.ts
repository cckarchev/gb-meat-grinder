export const VBOAR_TAC = 8;

/** Bonus Time: +1 TAC this attack; costs 1 momentum before the roll. */
export const BONUS_TIME_TAC_BONUS = 1;

/** Charge + two bought attacks (Berserker does not add base rows). */
export const BASE_ATTACK_COUNT = 3;

/** Bases plus up to one berserker per base (damage-gated). */
export const MAX_ATTACK_COUNT = 6;

/** @deprecated Use MAX_ATTACK_COUNT */
export const ATTACK_COUNT = MAX_ATTACK_COUNT;

export const DEF_MIN = 2;
export const DEF_MAX = 6;

export const ARM_MIN = 0;
export const ARM_MAX = 6;

export const HP_MIN = 1;
export const HP_MAX = 30;
export const HP_DEFAULT = 16;

/** Momentum the Boar begins the activation with (earned momentum has no cap). */
export const STARTING_MOMENTUM_MIN = 0;
export const STARTING_MOMENTUM_MAX = 20;
