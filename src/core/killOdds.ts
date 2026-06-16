import {
  effectiveDamageForChoice,
  netSuccessesForChoice,
} from '@/core/playbook';
import { maxPlaybookNet } from '@/core/playbookIndex';
import { binomialPmf } from '@/core/probability';
import type { AttackerData } from '@/types/core/attacker';
import type { AttackRollContext } from '@/types/core/attackSequence';
import type { PlaybookDamageMods, WrapPick } from '@/types/core/playbook';

/** A discrete damage distribution: damage value -> probability. */
type DamageDistribution = Map<number, number>;

/** Damage a single swing deals as a function of its net successes. */
type DamageForNet = (net: number) => number;

/** Most card damage reachable in a single playbook column within `budget` net. */
function bestDamageWithinBudget(
  attacker: AttackerData,
  mods: PlaybookDamageMods,
  budget: number,
): number {
  if (budget < 1) return 0;
  let best = 0;
  for (const col of attacker.playbook) {
    if (col.netSuccesses < 1 || col.netSuccesses > budget) continue;
    for (const r of col.results) {
      const d = effectiveDamageForChoice(attacker, r.id, mods);
      if (d > best) best = d;
    }
  }
  return best;
}

/**
 * Damage a roll of `net` net successes deals if you stick to the lines you
 * actually picked: each picked slot deals its line's damage once the roll
 * reaches it, otherwise the best lower column that slot can reach. Over-rolls
 * give nothing extra (you committed to these picks, not max damage).
 */
export function pickedDamageForNet(
  attacker: AttackerData,
  mods: PlaybookDamageMods,
  picks: readonly WrapPick[],
  net: number,
): number {
  if (net < 1) return 0;
  const maxNet = maxPlaybookNet(attacker);
  let total = 0;
  for (let slot = 0; slot < picks.length; slot++) {
    const slotBudget = Math.min(maxNet, net - slot * maxNet);
    if (slotBudget < 1) break;
    const id = picks[slot];
    if (id == null) continue;
    const pickedCol = netSuccessesForChoice(attacker, id);
    total +=
      slotBudget >= pickedCol
        ? effectiveDamageForChoice(attacker, id, mods)
        : bestDamageWithinBudget(attacker, mods, slotBudget);
  }
  return total;
}

/**
 * Distribution of damage from one swing. Net successes are `max(0, hits - ARM)`
 * with hits ~ Binomial(tac, pHit); each net level maps to damage via `damageForNet`.
 */
function swingDamageDistribution(
  attack: AttackRollContext,
  damageForNet: DamageForNet,
): DamageDistribution {
  const { tac, armor, pHit } = attack;
  const maxNet = Math.max(0, tac - armor);
  const dist: DamageDistribution = new Map();
  for (let net = 0; net <= maxNet; net++) {
    let prob: number;
    if (net === 0) {
      prob = 0;
      for (let h = 0; h <= armor; h++) prob += binomialPmf(tac, pHit, h);
    } else {
      prob = binomialPmf(tac, pHit, net + armor);
    }
    if (prob <= 0) continue;
    const dmg = damageForNet(net);
    dist.set(dmg, (dist.get(dmg) ?? 0) + prob);
  }
  return dist;
}

function convolve(
  a: DamageDistribution,
  b: DamageDistribution,
): DamageDistribution {
  const out: DamageDistribution = new Map();
  for (const [da, pa] of a) {
    for (const [db, pb] of b) {
      const d = da + db;
      out.set(d, (out.get(d) ?? 0) + pa * pb);
    }
  }
  return out;
}

export type ActivationDamageOutcome = {
  /** P(total damage >= target HP). */
  killProbability: number;
  /** Mean total damage across the activation (including guaranteed flat damage). */
  expectedDamage: number;
  /** Mean target HP left afterwards: E[max(0, targetHp - total damage)]. */
  expectedHpRemaining: number;
  /** Total activation damage distribution (incl. flat damage): damage -> probability. */
  damageDistribution: ReadonlyMap<number, number>;
};

/**
 * Smallest total damage whose cumulative probability reaches `quantile` (0..1).
 * Used for "likely damage" ranges (e.g. 10th/90th percentile) from a discrete
 * damage distribution. Returns 0 for an empty distribution.
 */
export function damageQuantile(
  distribution: ReadonlyMap<number, number>,
  quantile: number,
): number {
  const damages = [...distribution.keys()].sort((a, b) => a - b);
  if (damages.length === 0) return 0;
  let cumulative = 0;
  for (const dmg of damages) {
    cumulative += distribution.get(dmg) ?? 0;
    if (cumulative >= quantile) return dmg;
  }
  return damages[damages.length - 1];
}

/**
 * Convolves every swing's damage distribution, then reports the chance the
 * activation drops the target and the mean damage dealt. `damageForNetOf`
 * selects the per-swing damage model (play-to-kill vs. sticking to picks).
 * `flatDamage` is guaranteed (special abilities) and applied as a baseline.
 */
function activationOutcome(
  attacks: readonly AttackRollContext[],
  flatDamage: number,
  targetHp: number,
  damageForNetOf: (attack: AttackRollContext) => DamageForNet,
): ActivationDamageOutcome {
  let total: DamageDistribution = new Map([[0, 1]]);
  for (const attack of attacks) {
    total = convolve(
      total,
      swingDamageDistribution(attack, damageForNetOf(attack)),
    );
  }

  // Fold guaranteed flat damage into the distribution so every stat below is
  // expressed in terms of total damage actually dealt to the target.
  const damageDistribution: DamageDistribution = new Map();
  for (const [dmg, prob] of total) {
    const withFlat = dmg + flatDamage;
    damageDistribution.set(
      withFlat,
      (damageDistribution.get(withFlat) ?? 0) + prob,
    );
  }

  let expectedDamage = 0;
  let expectedHpRemaining = 0;
  let killProbability = 0;
  for (const [dmg, prob] of damageDistribution) {
    expectedDamage += dmg * prob;
    expectedHpRemaining += Math.max(0, targetHp - dmg) * prob;
    if (dmg >= targetHp) killProbability += prob;
  }
  return {
    killProbability,
    expectedDamage,
    expectedHpRemaining,
    damageDistribution,
  };
}

/** Each swing only deals the damage of the lines you actually picked. */
export function planDamageOutcome(
  attacker: AttackerData,
  attacks: readonly AttackRollContext[],
  wrapPicks: readonly (readonly WrapPick[])[],
  mods: PlaybookDamageMods,
  flatDamage: number,
  targetHp: number,
): ActivationDamageOutcome {
  return activationOutcome(
    attacks,
    flatDamage,
    targetHp,
    (attack) => (net) =>
      pickedDamageForNet(
        attacker,
        mods,
        wrapPicks[attack.attackIndex] ?? [],
        net,
      ),
  );
}
