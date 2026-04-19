import {
  BASE_ATTACK_COUNT,
  BONUS_TIME_TAC_BONUS,
  DEF_MAX,
  DEF_MIN,
  VBOAR_TAC,
} from '@/core/constants';
import {
  MAX_PLAYBOOK_NET,
  PLAYBOOK,
  activationAttackIndices,
  attackRowIsActive,
  choiceUsesCharacterPlay,
  coverSwingClockIndices,
  netSuccessesForChoice,
  rowEffectsForPick,
  sanitizeCharacterPlayPicksWrap,
  wrapNetThresholdAllHits,
  wrapPickClearsCover,
  wrapSlotBudget,
  wrapSlotCount,
} from '@/core/playbook';
import type {
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';
import type { AttackRollContext } from '@/types/core/attackSequence';
import {
  hitProbabilityPerDie,
  maxNetSuccessesForRoll,
  probAttackSucceeds,
} from '@/core/probability';

export const CHARGE_TAC_BONUS = 4;

/** Effective enemy DEF stat for this row (charge + Defensive Stance = +1, capped). */
export function enemyDefBaseForAttackRow(
  enemyDef: number,
  attackIndex: number,
  chargeAttackIndex: number,
  enemyDefensiveStance: boolean,
): number {
  const stanceBonus =
    enemyDefensiveStance &&
    attackIndex < BASE_ATTACK_COUNT &&
    attackIndex === chargeAttackIndex
      ? 1
      : 0;
  return Math.min(DEF_MAX, enemyDef + stanceBonus);
}

/**
 * Cover: −1 TAC on this attack’s dice pool while the enemy is in terrain.
 * Push (>) or double push (>>) on any **earlier** attack in activation order
 * (base → berserker → …) clears that terrain benefit on later swings.
 */
export function coverTacPenaltyForAttack(
  enemyHasCover: boolean,
  wrapPicks: WrapPick[][],
  attackIndex: number,
): number {
  if (!enemyHasCover) return 0;
  /* Use fixed base → berserker clock so > / >> are never skipped when a berserker
   * row is omitted from `activationAttackIndices` (damage-gated). */
  const clock = coverSwingClockIndices();
  const pos = clock.indexOf(attackIndex);
  if (pos < 0) return 1;
  for (let p = 0; p < pos; p++) {
    const j = clock[p];
    const row = wrapPicks[j];
    if (!row?.length) continue;
    for (let k = 0; k < row.length; k++) {
      if (wrapPickClearsCover(row[k])) return 0;
    }
  }
  return 1;
}

function clone2d<T>(rows: T[][]): T[][] {
  return rows.map((r) => [...r]);
}

/**
 * Modifiers from all picks on attacks strictly before `attackIndex` in activation order
 * (base → its berserker → next base → …).
 */
export function modifiersBeforeAttack(
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  damageMods: PlaybookDamageMods,
): { tacBonus: number; defReduction: number } {
  const order = activationAttackIndices(wrapPicks, damageMods);
  const targetPos = order.indexOf(attackIndex);
  if (targetPos < 0) return { tacBonus: 0, defReduction: 0 };

  let tacBonus = 0;
  let defReduction = 0;
  for (let oi = 0; oi < targetPos; oi++) {
    const j = order[oi];
    for (let k = 0; k < wrapPicks[j].length; k++) {
      if (wrapPicks[j][k] == null) continue;
      const m = rowEffectsForPick(
        wrapPicks,
        characterPlayPicks,
        j,
        k,
        damageMods,
      );
      tacBonus += m.tacBonusForLater;
      defReduction += m.defReductionForLater;
    }
  }
  return { tacBonus, defReduction };
}

export function effectiveDefMinRoll(
  baseDef: number,
  defReduction: number,
): number {
  return Math.max(DEF_MIN, Math.min(DEF_MAX, baseDef - defReduction));
}

/**
 * Enemy DEF cannot be reduced below `DEF_MIN` on the dice. Each point of DEF
 * reduction beyond that cap becomes +1 TAC for Veteran Boar on later swings.
 */
export function tacBonusFromDefReductionCap(
  baseDef: number,
  defReduction: number,
): number {
  const maxDefReduction = Math.max(0, baseDef - DEF_MIN);
  return Math.max(0, defReduction - maxDefReduction);
}

export function tacForAttack(
  attackIndex: number,
  chargeAttackIndex: number,
  tacBonusFromSingledOut: number,
  coverTacPenalty = 0,
  bonusTimeTacBonus = 0,
  initialTacModifier = 0,
): number {
  const charge =
    attackIndex < BASE_ATTACK_COUNT && attackIndex === chargeAttackIndex
      ? CHARGE_TAC_BONUS
      : 0;
  return (
    VBOAR_TAC +
    charge +
    tacBonusFromSingledOut -
    coverTacPenalty +
    bonusTimeTacBonus +
    initialTacModifier
  );
}

export function tacForAttackRow(
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  chargeAttackIndex: number,
  enemyHasCover: boolean,
  enemyDefensiveStance: boolean,
  damageMods: PlaybookDamageMods,
  baseDef: number,
  bonusTimeByAttack: readonly boolean[],
  initialTacModifier: number,
): number {
  const { tacBonus, defReduction } = modifiersBeforeAttack(
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    damageMods,
  );
  const defForRow = enemyDefBaseForAttackRow(
    baseDef,
    attackIndex,
    chargeAttackIndex,
    enemyDefensiveStance,
  );
  const tacFromDefCap = tacBonusFromDefReductionCap(defForRow, defReduction);
  const coverPen = coverTacPenaltyForAttack(
    enemyHasCover,
    wrapPicks,
    attackIndex,
  );
  const bonusTimeTac =
    bonusTimeByAttack[attackIndex] === true ? BONUS_TIME_TAC_BONUS : 0;
  return tacForAttack(
    attackIndex,
    chargeAttackIndex,
    tacBonus + tacFromDefCap,
    coverPen,
    bonusTimeTac,
    initialTacModifier,
  );
}

/** Highest net successes reachable in one roll on this row (TAC − ARM cap). */
export function maxPlaybookColumnForRow(
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  chargeAttackIndex: number,
  armor: number,
  enemyHasCover: boolean,
  enemyDefensiveStance: boolean,
  damageMods: PlaybookDamageMods,
  baseDef: number,
  bonusTimeByAttack: readonly boolean[],
  initialTacModifier: number,
): number {
  const tac = tacForAttackRow(
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    chargeAttackIndex,
    enemyHasCover,
    enemyDefensiveStance,
    damageMods,
    baseDef,
    bonusTimeByAttack,
    initialTacModifier,
  );
  return maxNetSuccessesForRoll(tac, armor);
}

function firstReachableChoiceId(maxNet: number): PlaybookChoiceId {
  if (maxNet < 1) return PLAYBOOK[0].results[0].id;
  const target = Math.min(maxNet, MAX_PLAYBOOK_NET);
  const col = PLAYBOOK.find((c) => c.netSuccesses === target);
  return col?.results[0].id ?? PLAYBOOK[0].results[0].id;
}

/** Cheapest playbook line at or under `budget` that is not Knock Down. */
function firstPickInBudgetExcludingKd(budget: number): PlaybookChoiceId {
  if (budget < 1) return PLAYBOOK[0].results[0].id;
  const cols = [...PLAYBOOK].sort((a, b) => a.netSuccesses - b.netSuccesses);
  for (const col of cols) {
    if (col.netSuccesses > budget) continue;
    for (const r of col.results) {
      if (r.id === 'kd') continue;
      return r.id;
    }
  }
  return PLAYBOOK[0].results[0].id;
}

/** Only the first KD in activation order counts; later KD picks are replaced. */
function stripDuplicateKd(
  next: WrapPick[][],
  nextCharacterPlay: CharacterPlayPickSlot[][],
  chargeAttackIndex: number,
  armor: number,
  enemyHasCover: boolean,
  enemyDefensiveStance: boolean,
  damageMods: PlaybookDamageMods,
  baseDef: number,
  bonusTimeByAttack: readonly boolean[],
  initialTacModifier: number,
): boolean {
  let changed = false;
  let kdSeen = false;
  for (const i of activationAttackIndices(next, damageMods)) {
    const maxNet = maxPlaybookColumnForRow(
      next,
      nextCharacterPlay,
      i,
      chargeAttackIndex,
      armor,
      enemyHasCover,
      enemyDefensiveStance,
      damageMods,
      baseDef,
      bonusTimeByAttack,
      initialTacModifier,
    );
    for (let k = 0; k < next[i].length; k++) {
      const id = next[i][k];
      if (id !== 'kd') continue;
      if (!kdSeen) {
        kdSeen = true;
        continue;
      }
      const b = wrapSlotBudget(maxNet, k);
      const rep = firstPickInBudgetExcludingKd(b);
      next[i][k] = rep;
      nextCharacterPlay[i][k] = choiceUsesCharacterPlay(rep) ? 'so' : null;
      changed = true;
    }
  }
  return changed;
}

function clampRowPicks(
  picks: WrapPick[],
  characterPlayRow: CharacterPlayPickSlot[],
  maxNet: number,
): { picks: WrapPick[]; characterPlayRow: CharacterPlayPickSlot[] } {
  if (maxNet < 1) {
    return { picks: [null], characterPlayRow: [null] };
  }
  const n = wrapSlotCount(maxNet);
  const p: WrapPick[] = picks.slice(0, n);
  const g = characterPlayRow.slice(0, n);
  while (g.length < p.length) g.push(null);
  while (p.length < n) {
    p.push(null);
    g.push(null);
  }
  while (p.length > n) {
    p.pop();
    g.pop();
  }
  const b0 = wrapSlotBudget(maxNet, 0);
  if (p[0] != null && netSuccessesForChoice(p[0]) > b0) {
    const id = firstReachableChoiceId(b0);
    p[0] = id;
    g[0] = choiceUsesCharacterPlay(id) ? 'so' : null;
  }
  if (p[0] == null) {
    for (let s = 1; s < n; s++) {
      p[s] = null;
      g[s] = null;
    }
  }
  for (let s = 1; s < n; s++) {
    const b = wrapSlotBudget(maxNet, s);
    const id = p[s];
    if (id != null && netSuccessesForChoice(id) > b) {
      p[s] = null;
      g[s] = null;
    }
  }
  for (let s = 0; s < n; s++) {
    if (p[s] == null) {
      g[s] = null;
      continue;
    }
    if (!choiceUsesCharacterPlay(p[s])) g[s] = null;
    else if (g[s] == null) g[s] = 'so';
  }
  return { picks: p, characterPlayRow: g };
}

function rows2dEqual(a: WrapPick[][], b: WrapPick[][]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
}

function characterPlay2dEqual(
  a: CharacterPlayPickSlot[][],
  b: CharacterPlayPickSlot[][],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
}

/**
 * Keeps each attack’s wrap within TAC − ARM: drop tail picks until valid, then
 * sanitize character-play picks after GB / 1GB.
 */
export function clampAttackPlan(
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  chargeAttackIndex: number,
  armor: number,
  enemyHasCover: boolean,
  enemyDefensiveStance: boolean,
  damageMods: PlaybookDamageMods,
  baseDef: number,
  bonusTimeByAttack: readonly boolean[],
  initialTacModifier: number,
): { wrapPicks: WrapPick[][]; characterPlayPicks: CharacterPlayPickSlot[][] } {
  const next = clone2d(wrapPicks);
  let nextCharacterPlay = clone2d(characterPlayPicks);

  for (let pass = 0; pass < 30; pass++) {
    let passChanged = false;
    for (let i = 0; i < next.length; i++) {
      while (nextCharacterPlay[i].length > next[i].length) {
        nextCharacterPlay[i].pop();
        passChanged = true;
      }
      while (nextCharacterPlay[i].length < next[i].length) {
        nextCharacterPlay[i].push(null);
        passChanged = true;
      }
      if (!attackRowIsActive(next, i, damageMods)) {
        if (
          i >= BASE_ATTACK_COUNT &&
          (next[i].length > 0 || nextCharacterPlay[i].length > 0)
        ) {
          next[i] = [];
          nextCharacterPlay[i] = [];
          passChanged = true;
        }
        continue;
      }
      if (
        i >= BASE_ATTACK_COUNT &&
        attackRowIsActive(next, i, damageMods) &&
        next[i].length === 0
      ) {
        next[i] = [null];
        nextCharacterPlay[i] = [null];
        passChanged = true;
      }
      const maxNet = maxPlaybookColumnForRow(
        next,
        nextCharacterPlay,
        i,
        chargeAttackIndex,
        armor,
        enemyHasCover,
        enemyDefensiveStance,
        damageMods,
        baseDef,
        bonusTimeByAttack,
        initialTacModifier,
      );
      const r = clampRowPicks(next[i], nextCharacterPlay[i], maxNet);
      const rowSame =
        r.picks.length === next[i].length &&
        r.picks.every((id, j) => id === next[i][j]) &&
        r.characterPlayRow.length === nextCharacterPlay[i].length &&
        r.characterPlayRow.every((g, j) => g === nextCharacterPlay[i][j]);
      if (!rowSame) {
        next[i] = r.picks;
        nextCharacterPlay[i] = r.characterPlayRow;
        passChanged = true;
      }
    }
    if (
      stripDuplicateKd(
        next,
        nextCharacterPlay,
        chargeAttackIndex,
        armor,
        enemyHasCover,
        enemyDefensiveStance,
        damageMods,
        baseDef,
        bonusTimeByAttack,
        initialTacModifier,
      )
    ) {
      passChanged = true;
    }
    const { characterPlayPicks: sanitized, changed: cpSan } =
      sanitizeCharacterPlayPicksWrap(next, nextCharacterPlay, damageMods);
    if (cpSan) {
      nextCharacterPlay = sanitized;
      passChanged = true;
    }
    if (!passChanged) break;
  }

  if (
    rows2dEqual(next, wrapPicks) &&
    characterPlay2dEqual(nextCharacterPlay, characterPlayPicks)
  ) {
    return { wrapPicks, characterPlayPicks };
  }
  return { wrapPicks: next, characterPlayPicks: nextCharacterPlay };
}

export function computeAttackSequence(
  baseDef: number,
  armor: number,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  chargeAttackIndex: number,
  enemyHasCover: boolean,
  enemyDefensiveStance: boolean,
  damageMods: PlaybookDamageMods,
  bonusTimeByAttack: readonly boolean[],
  initialTacModifier: number,
): { attacks: AttackRollContext[] } {
  const attacks: AttackRollContext[] = [];

  for (const i of activationAttackIndices(wrapPicks, damageMods)) {
    const { tacBonus, defReduction } = modifiersBeforeAttack(
      wrapPicks,
      characterPlayPicks,
      i,
      damageMods,
    );
    const defForRow = enemyDefBaseForAttackRow(
      baseDef,
      i,
      chargeAttackIndex,
      enemyDefensiveStance,
    );
    const tacFromDefCap = tacBonusFromDefReductionCap(defForRow, defReduction);
    const defMin = effectiveDefMinRoll(defForRow, defReduction);
    const coverPen = coverTacPenaltyForAttack(enemyHasCover, wrapPicks, i);
    const bonusTimeTac =
      bonusTimeByAttack[i] === true ? BONUS_TIME_TAC_BONUS : 0;
    const tac = tacForAttack(
      i,
      chargeAttackIndex,
      tacBonus + tacFromDefCap,
      coverPen,
      bonusTimeTac,
      initialTacModifier,
    );
    const pHit = hitProbabilityPerDie(defMin);
    const need = wrapNetThresholdAllHits(wrapPicks[i]);
    const prob = probAttackSucceeds(tac, pHit, armor, need);
    attacks.push({
      attackIndex: i,
      tac,
      defMinRoll: defMin,
      pHit,
      netSuccessesNeeded: need,
      prob,
    });
  }

  return { attacks };
}
