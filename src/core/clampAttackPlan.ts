/**
 * Keeps a wrap / character-play plan legal as the inputs that bound it change.
 */

import { activationAttackIndices, attackRowIsActive } from '@/core/attackRows';
import {
  defaultCharacterPlayId,
  sanitizeCharacterPlayPicksWrap,
} from '@/core/characterPlayPicks';
import { maxPlaybookNet } from '@/core/playbookIndex';
import { maxPlaybookColumnForRow } from '@/core/swingModifiers';
import {
  choiceUsesCharacterPlay,
  getPlaybookResult,
  netSuccessesForChoice,
  wrapSlotBudget,
  wrapSlotCount,
} from '@/core/wrapSlots';
import type { AttackerData } from '@/types/core/attacker';
import type {
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';

/** Safety cap for the clamp fixpoint loop; real plans settle in a few passes. */
const MAX_CLAMP_PASSES = 30;

const clone2d = <T>(rows: T[][]): T[][] => {
  return rows.map((r) => [...r]);
};

const firstReachableChoiceId = (
  attacker: AttackerData,
  maxNet: number,
): PlaybookChoiceId => {
  if (maxNet < 1) {
    return attacker.playbook[0].results[0].id;
  }

  const target = Math.min(maxNet, maxPlaybookNet(attacker));
  const col = attacker.playbook.find((c) => c.netSuccesses === target);

  return col?.results[0].id ?? attacker.playbook[0].results[0].id;
};

/** Cheapest playbook line at or under `budget` that does not apply Knock Down. */
const firstPickInBudgetExcludingKd = (
  attacker: AttackerData,
  budget: number,
): PlaybookChoiceId => {
  if (budget < 1) {
    return attacker.playbook[0].results[0].id;
  }

  const cols = [...attacker.playbook].sort(
    (a, b) => a.netSuccesses - b.netSuccesses,
  );

  for (const col of cols) {
    if (col.netSuccesses > budget) {
      continue;
    }

    for (const r of col.results) {
      if (r.appliesKnockDown) {
        continue;
      }

      return r.id;
    }
  }

  return attacker.playbook[0].results[0].id;
};

/** Only the first KD in activation order counts; later KD picks are replaced. */
const stripDuplicateKd = (
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
  enemyKnockedDown: boolean,
): boolean => {
  let changed = false;
  // A target that is already Knocked Down counts as the one allowed KD, so every
  // playbook KD pick is redundant and gets replaced.
  let kdSeen = enemyKnockedDown;

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
};

const clampRowPicks = (
  attacker: AttackerData,
  picks: WrapPick[],
  characterPlayRow: CharacterPlayPickSlot[],
  maxNet: number,
): { picks: WrapPick[]; characterPlayRow: CharacterPlayPickSlot[] } => {
  if (maxNet < 1) {
    return { picks: [null], characterPlayRow: [null] };
  }

  const n = wrapSlotCount(attacker, maxNet);
  const p: WrapPick[] = picks.slice(0, n);
  const g = characterPlayRow.slice(0, n);

  while (g.length < p.length) {
    g.push(null);
  }

  while (p.length < n) {
    p.push(null);
    g.push(null);
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

    if (!choiceUsesCharacterPlay(attacker, p[s])) {
      g[s] = null;
    } else if (g[s] == null) {
      g[s] = defaultCharacterPlayId(attacker);
    }
  }

  return { picks: p, characterPlayRow: g };
};

const rows2dEqual = (a: WrapPick[][], b: WrapPick[][]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) {
      return false;
    }

    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) {
        return false;
      }
    }
  }

  return true;
};

const characterPlay2dEqual = (
  a: CharacterPlayPickSlot[][],
  b: CharacterPlayPickSlot[][],
): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) {
      return false;
    }

    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Keeps each attack’s wrap within TAC − ARM: drop tail picks until valid, then
 * sanitize character-play picks after GB / 1GB. Inactive rows (base rows beyond
 * the allocated influence, or damage-less berserkers) are emptied.
 */
export const clampAttackPlan = (
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
  enemyKnockedDown: boolean,
): {
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
} => {
  const next = clone2d(wrapPicks);
  let nextCharacterPlay = clone2d(characterPlayPicks);

  for (let pass = 0; pass < MAX_CLAMP_PASSES; pass++) {
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
        enemyKnockedDown,
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

    if (!passChanged) {
      break;
    }
  }

  if (
    rows2dEqual(next, wrapPicks) &&
    characterPlay2dEqual(nextCharacterPlay, characterPlayPicks)
  ) {
    return { wrapPicks, characterPlayPicks };
  }

  return { wrapPicks: next, characterPlayPicks: nextCharacterPlay };
};
