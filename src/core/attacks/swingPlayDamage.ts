/** Damage a swing's character plays deal, including plays scaled by the target's current HP. */

import type {
  SwingState,
  TimelineParams,
} from '@/core/attacks/activationTimeline.types';
import {
  effectivePlayForPick,
  getCharacterPlay,
} from '@/core/characterPlays/characterPlayLookup';
import { effectivePlayDamage } from '@/core/damage/damage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type { CharacterPlay } from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/playbookIndex';
import { sumOf } from '@/core/shared/sumOf';

/** Total play damage a swing deals when every pick on it lands. */
export const swingPlayDamage = (state: SwingState): number => {
  return sumOf(state.playDamageBySlot, (damage) => damage);
};

/** Condition damage of a play that deals the target's current HP over `divisor`. */
const currentHealthDamage = (hpLeft: number, divisor: number): number => {
  const remaining = Math.max(0, hpLeft);

  return Math.floor(remaining / divisor);
};

/**
 * A swing's play damage by slot when the target has `hpLeft` HP before it:
 * plays scaled by current HP are recomputed, the rest keep their damage.
 */
export const playDamageForHealth = (
  state: SwingState,
  hpLeft: number,
): number[] => {
  return state.playDamageBySlot.map((damage, slot) => {
    const divisor = state.healthPlayDivisorBySlot[slot] ?? 0;

    if (divisor <= 0) {
      return damage;
    }

    return currentHealthDamage(hpLeft, divisor);
  });
};

/** Whether any of a swing's plays deals damage scaled by the target's current HP. */
export const swingHasHealthPlay = (state: SwingState): boolean => {
  return state.healthPlayDivisorBySlot.some((divisor) => divisor > 0);
};

/** Whether the play in this slot deals damage scaled by the target's current HP. */
export const slotScalesWithHealth = (
  state: SwingState,
  slot: number,
): boolean => {
  const divisor = state.healthPlayDivisorBySlot[slot] ?? 0;

  return divisor > 0;
};

type SwingPlayDamage = Pick<
  SwingState,
  'damagingPlayBySlot' | 'playDamageBySlot' | 'healthPlayDivisorBySlot'
>;

/**
 * The damaging plays one swing's picks trigger. A Once Per Turn play deals its
 * damage only on the first pick that triggers it; `usedOncePerTurn` carries
 * those across the walk. `hpLeft` is the target's HP before this swing, for
 * plays scaled by current HP.
 */
export const swingPlayDamageFor = (
  plan: AttackPlan,
  params: TimelineParams,
  attackIndex: number,
  usedOncePerTurn: Set<string>,
  hpLeft: number,
): SwingPlayDamage => {
  const { attacker, damageMods } = params;
  const row = plan.wrapPicks[attackIndex] ?? [];

  const damagingPlayBySlot: (CharacterPlay | null)[] = row.map(() => null);
  const playDamageBySlot: number[] = row.map(() => 0);
  const healthPlayDivisorBySlot: number[] = row.map(() => 0);

  row.forEach((id, pickIndex) => {
    if (id == null || !choiceUsesCharacterPlay(attacker, id)) {
      return;
    }

    const playId = effectivePlayForPick(
      attacker,
      plan.characterPlayPicks,
      attackIndex,
      pickIndex,
    );

    const play = getCharacterPlay(attacker, playId);
    const printedDamage = play?.damage ?? 0;
    const divisor = play?.currentHealthDivisor ?? 0;
    const dealsDamage = printedDamage > 0 || divisor > 0;

    if (play == null || !dealsDamage) {
      return;
    }

    const spent = play.oncePerTurn && usedOncePerTurn.has(play.id);

    if (spent) {
      return;
    }

    if (play.oncePerTurn) {
      usedOncePerTurn.add(play.id);
    }

    damagingPlayBySlot[pickIndex] = play;

    if (divisor > 0) {
      healthPlayDivisorBySlot[pickIndex] = divisor;
      playDamageBySlot[pickIndex] = currentHealthDamage(hpLeft, divisor);

      return;
    }

    playDamageBySlot[pickIndex] = effectivePlayDamage(
      attacker,
      printedDamage,
      damageMods,
    );
  });

  return { damagingPlayBySlot, playDamageBySlot, healthPlayDivisorBySlot };
};
