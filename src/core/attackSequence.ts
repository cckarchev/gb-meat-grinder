import { BONUS_TIME_TAC_BONUS, DEF_MAX, DEF_MIN } from '@/core/constants';
import { maxPlaybookNet } from '@/core/playbookIndex';
import {
  activationAttackIndices,
  armorReductionBeforeAttack,
  attackRowIsActive,
  choiceUsesCharacterPlay,
  coverSwingClockIndices,
  defaultCharacterPlayId,
  getPlaybookResult,
  netSuccessesForChoice,
  rowEffectsForPick,
  sanitizeCharacterPlayPicksWrap,
  wrapNetThresholdAllHits,
  wrapPickClearsCover,
  wrapSlotBudget,
  wrapSlotCount,
} from '@/core/playbook';
import type { AttackerData } from '@/types/core/attacker';
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
  activeBaseCount: number,
): number {
  const stanceBonus =
    enemyDefensiveStance &&
    attackIndex < activeBaseCount &&
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
  attacker: AttackerData,
  enemyHasCover: boolean,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  activeBaseCount: number,
): number {
  if (!enemyHasCover) return 0;
  /* Use fixed base → berserker clock so > / >> are never skipped when a berserker
   * row is omitted from `activationAttackIndices` (damage-gated). */
  const clock = coverSwingClockIndices(attacker, activeBaseCount);
  const pos = clock.indexOf(attackIndex);
  if (pos < 0) return 1;
  for (let p = 0; p < pos; p++) {
    const j = clock[p];
    const row = wrapPicks[j];
    if (!row?.length) continue;
    for (let k = 0; k < row.length; k++) {
      if (wrapPickClearsCover(attacker, row[k])) return 0;
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
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): { tacBonus: number; defReduction: number } {
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
  const targetPos = order.indexOf(attackIndex);
  if (targetPos < 0) return { tacBonus: 0, defReduction: 0 };

  let tacBonus = 0;
  let defReduction = 0;
  for (let oi = 0; oi < targetPos; oi++) {
    const j = order[oi];
    for (let k = 0; k < wrapPicks[j].length; k++) {
      if (wrapPicks[j][k] == null) continue;
      const m = rowEffectsForPick(
        attacker,
        wrapPicks,
        characterPlayPicks,
        j,
        k,
        damageMods,
        activeBaseCount,
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
 * reduction beyond that cap becomes +1 TAC for the attacker on later swings.
 */
export function tacBonusFromDefReductionCap(
  baseDef: number,
  defReduction: number,
): number {
  const maxDefReduction = Math.max(0, baseDef - DEF_MIN);
  return Math.max(0, defReduction - maxDefReduction);
}

export function tacForAttack(
  attacker: AttackerData,
  attackIndex: number,
  chargeAttackIndex: number,
  tacBonusFromSingledOut: number,
  activeBaseCount: number,
  coverTacPenalty = 0,
  bonusTimeTacBonus = 0,
  initialTacModifier = 0,
): number {
  const charge =
    attackIndex < activeBaseCount && attackIndex === chargeAttackIndex
      ? CHARGE_TAC_BONUS
      : 0;
  return (
    attacker.tac +
    charge +
    tacBonusFromSingledOut -
    coverTacPenalty +
    bonusTimeTacBonus +
    initialTacModifier
  );
}

export function tacForAttackRow(
  attacker: AttackerData,
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
  activeBaseCount: number,
): number {
  const { tacBonus, defReduction } = modifiersBeforeAttack(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    damageMods,
    activeBaseCount,
  );
  const defForRow = enemyDefBaseForAttackRow(
    baseDef,
    attackIndex,
    chargeAttackIndex,
    enemyDefensiveStance,
    activeBaseCount,
  );
  const tacFromDefCap = tacBonusFromDefReductionCap(defForRow, defReduction);
  const coverPen = coverTacPenaltyForAttack(
    attacker,
    enemyHasCover,
    wrapPicks,
    attackIndex,
    activeBaseCount,
  );
  const bonusTimeTac =
    bonusTimeByAttack[attackIndex] === true ? BONUS_TIME_TAC_BONUS : 0;
  return tacForAttack(
    attacker,
    attackIndex,
    chargeAttackIndex,
    tacBonus + tacFromDefCap,
    activeBaseCount,
    coverPen,
    bonusTimeTac,
    initialTacModifier,
  );
}

/** Highest net successes reachable in one roll on this row (TAC − ARM cap). */
export function maxPlaybookColumnForRow(
  attacker: AttackerData,
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
  activeBaseCount: number,
): number {
  const tac = tacForAttackRow(
    attacker,
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
    activeBaseCount,
  );
  const rowArmor = armorForAttackRow(
    attacker,
    armor,
    wrapPicks,
    characterPlayPicks,
    damageMods,
    attackIndex,
    activeBaseCount,
  );
  return maxNetSuccessesForRoll(tac, rowArmor);
}

/** Enemy ARM for a swing: the buff-reduced base minus any earlier GB They Ain't Tough. */
function armorForAttackRow(
  attacker: AttackerData,
  baseArmor: number,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  activeBaseCount: number,
): number {
  return Math.max(
    0,
    baseArmor -
      armorReductionBeforeAttack(
        attacker,
        wrapPicks,
        characterPlayPicks,
        damageMods,
        attackIndex,
        activeBaseCount,
      ),
  );
}

function firstReachableChoiceId(
  attacker: AttackerData,
  maxNet: number,
): PlaybookChoiceId {
  if (maxNet < 1) return attacker.playbook[0].results[0].id;
  const target = Math.min(maxNet, maxPlaybookNet(attacker));
  const col = attacker.playbook.find((c) => c.netSuccesses === target);
  return col?.results[0].id ?? attacker.playbook[0].results[0].id;
}

/** Cheapest playbook line at or under `budget` that does not apply Knock Down. */
function firstPickInBudgetExcludingKd(
  attacker: AttackerData,
  budget: number,
): PlaybookChoiceId {
  if (budget < 1) return attacker.playbook[0].results[0].id;
  const cols = [...attacker.playbook].sort(
    (a, b) => a.netSuccesses - b.netSuccesses,
  );
  for (const col of cols) {
    if (col.netSuccesses > budget) continue;
    for (const r of col.results) {
      if (r.appliesKnockDown) continue;
      return r.id;
    }
  }
  return attacker.playbook[0].results[0].id;
}

/** Only the first KD in activation order counts; later KD picks are replaced. */
function stripDuplicateKd(
  attacker: AttackerData,
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
  activeBaseCount: number,
): boolean {
  let changed = false;
  let kdSeen = false;
  for (const i of activationAttackIndices(
    attacker,
    next,
    damageMods,
    activeBaseCount,
  )) {
    const maxNet = maxPlaybookColumnForRow(
      attacker,
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
      activeBaseCount,
    );
    for (let k = 0; k < next[i].length; k++) {
      const id = next[i][k];
      if (id == null || !getPlaybookResult(attacker, id).appliesKnockDown) {
        continue;
      }
      if (!kdSeen) {
        kdSeen = true;
        continue;
      }
      const b = wrapSlotBudget(attacker, maxNet, k);
      const rep = firstPickInBudgetExcludingKd(attacker, b);
      next[i][k] = rep;
      nextCharacterPlay[i][k] = choiceUsesCharacterPlay(attacker, rep)
        ? defaultCharacterPlayId(attacker)
        : null;
      changed = true;
    }
  }
  return changed;
}

function clampRowPicks(
  attacker: AttackerData,
  picks: WrapPick[],
  characterPlayRow: CharacterPlayPickSlot[],
  maxNet: number,
): { picks: WrapPick[]; characterPlayRow: CharacterPlayPickSlot[] } {
  if (maxNet < 1) {
    return { picks: [null], characterPlayRow: [null] };
  }
  const n = wrapSlotCount(attacker, maxNet);
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
  const b0 = wrapSlotBudget(attacker, maxNet, 0);
  if (p[0] != null && netSuccessesForChoice(attacker, p[0]) > b0) {
    const id = firstReachableChoiceId(attacker, b0);
    p[0] = id;
    g[0] = choiceUsesCharacterPlay(attacker, id)
      ? defaultCharacterPlayId(attacker)
      : null;
  }
  if (p[0] == null) {
    for (let s = 1; s < n; s++) {
      p[s] = null;
      g[s] = null;
    }
  }
  for (let s = 1; s < n; s++) {
    const b = wrapSlotBudget(attacker, maxNet, s);
    const id = p[s];
    if (id != null && netSuccessesForChoice(attacker, id) > b) {
      p[s] = null;
      g[s] = null;
    }
  }
  for (let s = 0; s < n; s++) {
    if (p[s] == null) {
      g[s] = null;
      continue;
    }
    if (!choiceUsesCharacterPlay(attacker, p[s])) g[s] = null;
    else if (g[s] == null) g[s] = defaultCharacterPlayId(attacker);
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
 * sanitize character-play picks after GB / 1GB. Inactive rows (base rows beyond
 * the allocated influence, or damage-less berserkers) are emptied.
 */
export function clampAttackPlan(
  attacker: AttackerData,
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
  activeBaseCount: number,
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
      const active = attackRowIsActive(
        attacker,
        next,
        i,
        damageMods,
        activeBaseCount,
      );
      if (!active) {
        if (next[i].length > 0 || nextCharacterPlay[i].length > 0) {
          next[i] = [];
          nextCharacterPlay[i] = [];
          passChanged = true;
        }
        continue;
      }
      if (next[i].length === 0) {
        next[i] = [null];
        nextCharacterPlay[i] = [null];
        passChanged = true;
      }
      const maxNet = maxPlaybookColumnForRow(
        attacker,
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
        activeBaseCount,
      );
      const r = clampRowPicks(attacker, next[i], nextCharacterPlay[i], maxNet);
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
        attacker,
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
        activeBaseCount,
      )
    ) {
      passChanged = true;
    }
    const { characterPlayPicks: sanitized, changed: cpSan } =
      sanitizeCharacterPlayPicksWrap(
        attacker,
        next,
        nextCharacterPlay,
        damageMods,
        activeBaseCount,
      );
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
  attacker: AttackerData,
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
  activeBaseCount: number,
): { attacks: AttackRollContext[] } {
  const attacks: AttackRollContext[] = [];

  for (const i of activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  )) {
    const { tacBonus, defReduction } = modifiersBeforeAttack(
      attacker,
      wrapPicks,
      characterPlayPicks,
      i,
      damageMods,
      activeBaseCount,
    );
    const defForRow = enemyDefBaseForAttackRow(
      baseDef,
      i,
      chargeAttackIndex,
      enemyDefensiveStance,
      activeBaseCount,
    );
    const tacFromDefCap = tacBonusFromDefReductionCap(defForRow, defReduction);
    const defMin = effectiveDefMinRoll(defForRow, defReduction);
    const coverPen = coverTacPenaltyForAttack(
      attacker,
      enemyHasCover,
      wrapPicks,
      i,
      activeBaseCount,
    );
    const bonusTimeTac =
      bonusTimeByAttack[i] === true ? BONUS_TIME_TAC_BONUS : 0;
    const tac = tacForAttack(
      attacker,
      i,
      chargeAttackIndex,
      tacBonus + tacFromDefCap,
      activeBaseCount,
      coverPen,
      bonusTimeTac,
      initialTacModifier,
    );
    const rowArmor = armorForAttackRow(
      attacker,
      armor,
      wrapPicks,
      characterPlayPicks,
      damageMods,
      i,
      activeBaseCount,
    );
    const pHit = hitProbabilityPerDie(defMin);
    const need = wrapNetThresholdAllHits(attacker, wrapPicks[i]);
    const prob = probAttackSucceeds(tac, pHit, rowArmor, need);
    attacks.push({
      attackIndex: i,
      tac,
      armor: rowArmor,
      defMinRoll: defMin,
      pHit,
      netSuccessesNeeded: need,
      prob,
    });
  }

  return { attacks };
}
