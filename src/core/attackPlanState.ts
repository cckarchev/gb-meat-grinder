import { clampAttackPlan } from './attackSequence';
import { MAX_ATTACK_COUNT } from './constants';
import {
  choiceUsesCharacterPlay,
  DEFAULT_PLAYBOOK_DAMAGE_MODS,
  defaultCharacterPlayPicksWrap,
  defaultWrapPicks,
  sanitizeCharacterPlayPicksWrap,
  type CharacterPlayPick,
  type CharacterPlayPickSlot,
  type PlaybookChoiceId,
  type PlaybookDamageMods,
  type WrapPick,
} from './playbook';

export type AttackPlan = {
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
};

/** Inputs to `clampAttackPlan` bundled for reuse with `clampAttackPlanState`. */
export type AttackPlanClampParams = {
  chargeAttackIndex: number;
  armor: number;
  enemyHasCover: boolean;
  damageMods: PlaybookDamageMods;
  def: number;
  bonusTimeByAttack: readonly boolean[];
  initialTacModifier: number;
};

export function createInitialAttackPlan(): AttackPlan {
  const wp = defaultWrapPicks();
  const cp = defaultCharacterPlayPicksWrap();
  const noBonus = Array.from({ length: MAX_ATTACK_COUNT }, () => false);
  const r = clampAttackPlan(
    wp,
    cp,
    0,
    1,
    false,
    DEFAULT_PLAYBOOK_DAMAGE_MODS,
    4,
    noBonus,
    0,
  );
  return { wrapPicks: r.wrapPicks, characterPlayPicks: r.characterPlayPicks };
}

export function clampAttackPlanState(
  prev: AttackPlan,
  params: AttackPlanClampParams,
): AttackPlan {
  const r = clampAttackPlan(
    prev.wrapPicks,
    prev.characterPlayPicks,
    params.chargeAttackIndex,
    params.armor,
    params.enemyHasCover,
    params.damageMods,
    params.def,
    params.bonusTimeByAttack,
    params.initialTacModifier,
  );
  if (
    r.wrapPicks === prev.wrapPicks &&
    r.characterPlayPicks === prev.characterPlayPicks
  ) {
    return prev;
  }
  return { wrapPicks: r.wrapPicks, characterPlayPicks: r.characterPlayPicks };
}

/** Returns `null` when the choice is a no-op. */
export function nextPlanAfterWrapChoice(
  prev: AttackPlan,
  attackIndex: number,
  pickIndex: number,
  id: PlaybookChoiceId | null,
): AttackPlan | null {
  if (pickIndex === 0 && id === null) return null;
  if (prev.wrapPicks[attackIndex][pickIndex] === id) return null;

  const nextPicks = prev.wrapPicks.map((row, idx) =>
    idx === attackIndex
      ? row.map((cur, j) => (j === pickIndex ? id : cur))
      : [...row],
  );
  const nextCharacterPlay = prev.characterPlayPicks.map((row, idx) => {
    if (idx !== attackIndex) return [...row];
    const nr = [...row];
    while (nr.length < nextPicks[idx].length) nr.push(null);
    if (id === null || !choiceUsesCharacterPlay(id)) nr[pickIndex] = null;
    else if (nr[pickIndex] == null) nr[pickIndex] = 'so';
    return nr.slice(0, nextPicks[idx].length);
  });

  return { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay };
}

/** Returns `null` when there is no continuation to clear. */
export function nextPlanAfterClearWrapContinuation(
  prev: AttackPlan,
  attackIndex: number,
): AttackPlan | null {
  const row = prev.wrapPicks[attackIndex];
  if (row.length <= 1) return null;

  const pick0 = row[0];
  let cp0: CharacterPlayPickSlot =
    prev.characterPlayPicks[attackIndex]?.[0] ?? null;
  if (pick0 == null || !choiceUsesCharacterPlay(pick0)) cp0 = null;

  const nextPicks = prev.wrapPicks.map((r, idx) =>
    idx === attackIndex ? [pick0] : [...r],
  );
  const nextCharacterPlay = prev.characterPlayPicks.map((r, idx) =>
    idx === attackIndex ? [cp0] : [...r],
  );

  return { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay };
}

/** Returns `null` when the pick is unchanged. */
export function nextPlanAfterCharacterPlayPick(
  prev: AttackPlan,
  attackIndex: number,
  pickIndex: number,
  pick: CharacterPlayPick,
  damageMods: PlaybookDamageMods,
): AttackPlan | null {
  if (prev.characterPlayPicks[attackIndex]?.[pickIndex] === pick) return null;

  const nextCharacterPlay = prev.characterPlayPicks.map((row, idx) => {
    if (idx !== attackIndex) return [...row];
    const nr = [...row];
    nr[pickIndex] = pick;
    return nr;
  });
  const { characterPlayPicks: sanitized } = sanitizeCharacterPlayPicksWrap(
    prev.wrapPicks,
    nextCharacterPlay,
    damageMods,
  );
  return { wrapPicks: prev.wrapPicks, characterPlayPicks: sanitized };
}
