import { DEF_MAX, DEF_MIN, VBOAR_TAC } from './constants'
import {
  MAX_PLAYBOOK_NET,
  PLAYBOOK,
  choiceUsesGbFollowUp,
  type GbFollowUpSlot,
  type PlaybookChoiceId,
  type WrapPick,
  netSuccessesForChoice,
  rowEffectsForPick,
  sanitizeGbFollowUpsWrap,
  wrapNetCostSum,
  wrapSlotBudget,
  wrapSlotCount,
} from './playbook'
import {
  hitProbabilityPerDie,
  maxNetSuccessesForRoll,
  probAttackSucceeds,
} from './probability'

export const CHARGE_TAC_BONUS = 4

function clone2d<T>(rows: T[][]): T[][] {
  return rows.map((r) => [...r])
}

/** Modifiers from all picks on attacks `0 .. attackIndex-1` (assuming each prior pick hit). */
export function modifiersBeforeAttack(
  wrapPicks: WrapPick[][],
  gbFollowUps: GbFollowUpSlot[][],
  attackIndex: number,
): { tacBonus: number; defReduction: number } {
  let tacBonus = 0
  let defReduction = 0
  for (let j = 0; j < attackIndex; j++) {
    for (let k = 0; k < wrapPicks[j].length; k++) {
      if (wrapPicks[j][k] == null) continue
      const m = rowEffectsForPick(wrapPicks, gbFollowUps, j, k)
      tacBonus += m.tacBonusForLater
      defReduction += m.defReductionForLater
    }
  }
  return { tacBonus, defReduction }
}

export function effectiveDefMinRoll(
  baseDef: number,
  defReduction: number,
): number {
  return Math.max(DEF_MIN, Math.min(DEF_MAX, baseDef - defReduction))
}

export function tacForAttack(
  attackIndex: number,
  chargeAttackIndex: number,
  tacBonusFromSingledOut: number,
): number {
  const charge = attackIndex === chargeAttackIndex ? CHARGE_TAC_BONUS : 0
  return VBOAR_TAC + charge + tacBonusFromSingledOut
}

export function tacForAttackRow(
  wrapPicks: WrapPick[][],
  gbFollowUps: GbFollowUpSlot[][],
  attackIndex: number,
  chargeAttackIndex: number,
): number {
  const { tacBonus } = modifiersBeforeAttack(wrapPicks, gbFollowUps, attackIndex)
  return tacForAttack(attackIndex, chargeAttackIndex, tacBonus)
}

/** Highest net successes reachable in one roll on this row (TAC − ARM cap). */
export function maxPlaybookColumnForRow(
  wrapPicks: WrapPick[][],
  gbFollowUps: GbFollowUpSlot[][],
  attackIndex: number,
  chargeAttackIndex: number,
  armor: number,
): number {
  const tac = tacForAttackRow(
    wrapPicks,
    gbFollowUps,
    attackIndex,
    chargeAttackIndex,
  )
  return maxNetSuccessesForRoll(tac, armor)
}

function firstReachableChoiceId(maxNet: number): PlaybookChoiceId {
  if (maxNet < 1) return PLAYBOOK[0].results[0].id
  const target = Math.min(maxNet, MAX_PLAYBOOK_NET)
  const col = PLAYBOOK.find((c) => c.netSuccesses === target)
  return col?.results[0].id ?? PLAYBOOK[0].results[0].id
}

/** First result in the lowest column that fits the remaining net budget. */
export function firstValidChoiceForBudget(budget: number): PlaybookChoiceId {
  if (budget < 1) return PLAYBOOK[0].results[0].id
  const col = PLAYBOOK.find((c) => c.netSuccesses <= budget)
  return col?.results[0].id ?? PLAYBOOK[0].results[0].id
}

/** Cheapest playbook line at or under `budget` that is not Knock Down. */
function firstPickInBudgetExcludingKd(budget: number): PlaybookChoiceId {
  if (budget < 1) return PLAYBOOK[0].results[0].id
  const cols = [...PLAYBOOK].sort(
    (a, b) => a.netSuccesses - b.netSuccesses,
  )
  for (const col of cols) {
    if (col.netSuccesses > budget) continue
    for (const r of col.results) {
      if (r.id === 'kd') continue
      return r.id
    }
  }
  return PLAYBOOK[0].results[0].id
}

/** Only the first KD in activation order counts; later KD picks are replaced. */
function stripDuplicateKd(
  next: WrapPick[][],
  nextGb: GbFollowUpSlot[][],
  chargeAttackIndex: number,
  armor: number,
): boolean {
  let changed = false
  let kdSeen = false
  for (let i = 0; i < next.length; i++) {
    const maxNet = maxPlaybookColumnForRow(
      next,
      nextGb,
      i,
      chargeAttackIndex,
      armor,
    )
    for (let k = 0; k < next[i].length; k++) {
      const id = next[i][k]
      if (id !== 'kd') continue
      if (!kdSeen) {
        kdSeen = true
        continue
      }
      const b = wrapSlotBudget(maxNet, k)
      const rep = firstPickInBudgetExcludingKd(b)
      next[i][k] = rep
      nextGb[i][k] = choiceUsesGbFollowUp(rep) ? 'so' : null
      changed = true
    }
  }
  return changed
}

function clampRowPicks(
  picks: WrapPick[],
  gb: GbFollowUpSlot[],
  maxNet: number,
): { picks: WrapPick[]; gb: GbFollowUpSlot[] } {
  if (maxNet < 1) {
    const id = PLAYBOOK[0].results[0].id
    return { picks: [id], gb: [null] }
  }
  const n = wrapSlotCount(maxNet)
  const p: WrapPick[] = picks.slice(0, n)
  const g = gb.slice(0, n)
  while (g.length < p.length) g.push(null)
  while (p.length < n) {
    p.push(null)
    g.push(null)
  }
  while (p.length > n) {
    p.pop()
    g.pop()
  }
  const b0 = wrapSlotBudget(maxNet, 0)
  if (p[0] == null || netSuccessesForChoice(p[0]) > b0) {
    const id = firstReachableChoiceId(b0)
    p[0] = id
    g[0] = choiceUsesGbFollowUp(id) ? 'so' : null
  }
  for (let s = 1; s < n; s++) {
    const b = wrapSlotBudget(maxNet, s)
    const id = p[s]
    if (id != null && netSuccessesForChoice(id) > b) {
      p[s] = null
      g[s] = null
    }
  }
  for (let s = 0; s < n; s++) {
    if (p[s] == null) {
      g[s] = null
      continue
    }
    if (!choiceUsesGbFollowUp(p[s])) g[s] = null
    else if (g[s] == null) g[s] = 'so'
  }
  return { picks: p, gb: g }
}

function rows2dEqual(a: WrapPick[][], b: WrapPick[][]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false
    }
  }
  return true
}

function gb2dEqual(a: GbFollowUpSlot[][], b: GbFollowUpSlot[][]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false
    }
  }
  return true
}

/**
 * Keeps each attack’s wrap within TAC − ARM: drop tail picks until valid, then
 * sanitize GB follow-ups.
 */
export function clampAttackPlan(
  wrapPicks: WrapPick[][],
  gbFollowUps: GbFollowUpSlot[][],
  chargeAttackIndex: number,
  armor: number,
): { wrapPicks: WrapPick[][]; gbFollowUps: GbFollowUpSlot[][] } {
  const next = clone2d(wrapPicks)
  let nextGb = clone2d(gbFollowUps)

  for (let pass = 0; pass < 30; pass++) {
    let passChanged = false
    for (let i = 0; i < next.length; i++) {
      while (nextGb[i].length > next[i].length) {
        nextGb[i].pop()
        passChanged = true
      }
      while (nextGb[i].length < next[i].length) {
        nextGb[i].push(null)
        passChanged = true
      }
      const maxNet = maxPlaybookColumnForRow(
        next,
        nextGb,
        i,
        chargeAttackIndex,
        armor,
      )
      const r = clampRowPicks(next[i], nextGb[i], maxNet)
      const rowSame =
        r.picks.length === next[i].length &&
        r.picks.every((id, j) => id === next[i][j]) &&
        r.gb.length === nextGb[i].length &&
        r.gb.every((g, j) => g === nextGb[i][j])
      if (!rowSame) {
        next[i] = r.picks
        nextGb[i] = r.gb
        passChanged = true
      }
    }
    if (stripDuplicateKd(next, nextGb, chargeAttackIndex, armor)) {
      passChanged = true
    }
    const { gb: sanitized, changed: gbSan } = sanitizeGbFollowUpsWrap(
      next,
      nextGb,
    )
    if (gbSan) {
      nextGb = sanitized
      passChanged = true
    }
    if (!passChanged) break
  }

  if (rows2dEqual(next, wrapPicks) && gb2dEqual(nextGb, gbFollowUps)) {
    return { wrapPicks, gbFollowUps }
  }
  return { wrapPicks: next, gbFollowUps: nextGb }
}

export type AttackRollContext = {
  attackIndex: number
  tac: number
  defMinRoll: number
  pHit: number
  netSuccessesNeeded: number
  prob: number
}

export function computeAttackSequence(
  baseDef: number,
  armor: number,
  wrapPicks: WrapPick[][],
  gbFollowUps: GbFollowUpSlot[][],
  chargeAttackIndex: number,
): { attacks: AttackRollContext[]; probAll: number } {
  const attacks: AttackRollContext[] = []
  let probAll = 1

  for (let i = 0; i < wrapPicks.length; i++) {
    const { tacBonus, defReduction } = modifiersBeforeAttack(
      wrapPicks,
      gbFollowUps,
      i,
    )
    const defMin = effectiveDefMinRoll(baseDef, defReduction)
    const tac = tacForAttack(i, chargeAttackIndex, tacBonus)
    const pHit = hitProbabilityPerDie(defMin)
    const need = wrapNetCostSum(wrapPicks[i])
    const prob = probAttackSucceeds(tac, pHit, armor, need)
    probAll *= prob
    attacks.push({
      attackIndex: i,
      tac,
      defMinRoll: defMin,
      pHit,
      netSuccessesNeeded: need,
      prob,
    })
  }

  return { attacks, probAll }
}
