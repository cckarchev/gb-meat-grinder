import { clampAttackPlan } from '@/core/attackSequence';
import { activeBaseAttackCount, attackArraySize } from '@/core/attackStructure';
import {
  choiceUsesCharacterPlay,
  DEFAULT_PLAYBOOK_DAMAGE_MODS,
  defaultCharacterPlayId,
  defaultCharacterPlayPicksWrap,
  defaultWrapPicks,
  sanitizeCharacterPlayPicksWrap,
} from '@/core/playbook';
import type { AttackerData } from '@/types/core/attacker';
import type {
  AttackPlan,
  AttackPlanClampParams,
} from '@/types/core/attackPlan';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/types/core/playbook';

export function createInitialAttackPlan(
  attacker: AttackerData,
  influence: number,
  charging: boolean,
): AttackPlan {
  const wp = defaultWrapPicks(attackArraySize(attacker));
  const cp = defaultCharacterPlayPicksWrap(attackArraySize(attacker));
  const noBonus = Array.from(
    { length: attackArraySize(attacker) },
    () => false,
  );
  const r = clampAttackPlan(
    attacker,
    wp,
    cp,
    charging ? 0 : -1,
    1,
    false,
    false,
    DEFAULT_PLAYBOOK_DAMAGE_MODS,
    4,
    noBonus,
    0,
    activeBaseAttackCount(attacker, influence, charging),
    false,
  );
  return { wrapPicks: r.wrapPicks, characterPlayPicks: r.characterPlayPicks };
}

export function clampAttackPlanState(
  prev: AttackPlan,
  params: AttackPlanClampParams,
): AttackPlan {
  const r = clampAttackPlan(
    params.attacker,
    prev.wrapPicks,
    prev.characterPlayPicks,
    params.chargeAttackIndex,
    params.armor,
    params.enemyHasCover,
    params.enemyDefensiveStance,
    params.damageMods,
    params.enemyDef,
    params.bonusTimeByAttack,
    params.initialTacModifier,
    params.activeBaseCount,
    params.enemyKnockedDown,
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
  attacker: AttackerData,
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
    if (id === null || !choiceUsesCharacterPlay(attacker, id))
      nr[pickIndex] = null;
    else if (nr[pickIndex] == null)
      nr[pickIndex] = defaultCharacterPlayId(attacker);
    return nr.slice(0, nextPicks[idx].length);
  });

  return { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay };
}

/** Returns `null` when there is no continuation to clear. */
export function nextPlanAfterClearWrapContinuation(
  attacker: AttackerData,
  prev: AttackPlan,
  attackIndex: number,
): AttackPlan | null {
  const row = prev.wrapPicks[attackIndex];
  if (row.length <= 1) return null;

  const pick0 = row[0];
  let cp0: CharacterPlayPickSlot =
    prev.characterPlayPicks[attackIndex]?.[0] ?? null;
  if (pick0 == null || !choiceUsesCharacterPlay(attacker, pick0)) cp0 = null;

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
  attacker: AttackerData,
  prev: AttackPlan,
  attackIndex: number,
  pickIndex: number,
  pick: CharacterPlayPick,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): AttackPlan | null {
  if (prev.characterPlayPicks[attackIndex]?.[pickIndex] === pick) return null;

  const nextCharacterPlay = prev.characterPlayPicks.map((row, idx) => {
    if (idx !== attackIndex) return [...row];
    const nr = [...row];
    nr[pickIndex] = pick;
    return nr;
  });
  const { characterPlayPicks: sanitized } = sanitizeCharacterPlayPicksWrap(
    attacker,
    prev.wrapPicks,
    nextCharacterPlay,
    damageMods,
    activeBaseCount,
  );
  return { wrapPicks: prev.wrapPicks, characterPlayPicks: sanitized };
}
