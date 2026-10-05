import {
  activeBaseAttackCount,
  attackArraySize,
} from '@/core/attacks/attackStructure';
import { defaultCharacterPlayId } from '@/core/characterPlays/characterPlayLookup';
import { sanitizeCharacterPlayPicksWrap } from '@/core/characterPlays/sanitizeCharacterPlayPicks';
import { DEFAULT_PLAYBOOK_DAMAGE_MODS } from '@/core/damage/damage';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import { clampAttackPlan } from '@/core/plan/clampAttackPlan';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/core/playbook/playbook.types';
import {
  choiceUsesCharacterPlay,
  defaultCharacterPlayPicksWrap,
  defaultWrapPicks,
} from '@/core/playbook/wrapSlots';
import {
  ARM_DEFAULT,
  DEF_DEFAULT,
  NO_ATTACK_INDEX,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const createInitialAttackPlan = (
  attacker: AttackerData,
  influence: number,
  charging: boolean,
): AttackPlan => {
  const wp = defaultWrapPicks(attackArraySize(attacker));
  const cp = defaultCharacterPlayPicksWrap(attackArraySize(attacker));

  const noBonus = Array.from(
    { length: attackArraySize(attacker) },
    () => false,
  );

  const unclamped: AttackPlan = { wrapPicks: wp, characterPlayPicks: cp };

  return clampAttackPlan(unclamped, {
    attacker,
    chargeAttackIndex: charging ? 0 : NO_ATTACK_INDEX,
    armor: ARM_DEFAULT,
    enemyHasCover: false,
    enemyDefensiveStance: false,
    damageMods: DEFAULT_PLAYBOOK_DAMAGE_MODS,
    enemyDef: DEF_DEFAULT,
    bonusTimeByAttack: noBonus,
    initialTacModifier: 0,
    enemyKnockedDown: false,
    activeBaseCount: activeBaseAttackCount(attacker, influence, charging),
  });
};

/** Returns `null` when the choice is a no-op. */
export const nextPlanAfterWrapChoice = (
  attacker: AttackerData,
  prev: AttackPlan,
  attackIndex: number,
  pickIndex: number,
  id: PlaybookChoiceId | null,
): AttackPlan | null => {
  if (pickIndex === 0 && id === null) {
    return null;
  }

  if (prev.wrapPicks[attackIndex][pickIndex] === id) {
    return null;
  }

  const nextPicks = prev.wrapPicks.map((row, idx) =>
    idx === attackIndex
      ? row.map((cur, j) => (j === pickIndex ? id : cur))
      : [...row],
  );

  const nextCharacterPlay = prev.characterPlayPicks.map((row, idx) => {
    if (idx !== attackIndex) {
      return [...row];
    }

    const nr = [...row];

    while (nr.length < nextPicks[idx].length) {
      nr.push(null);
    }

    if (id === null || !choiceUsesCharacterPlay(attacker, id)) {
      nr[pickIndex] = null;
    } else if (nr[pickIndex] == null) {
      nr[pickIndex] = defaultCharacterPlayId(attacker);
    }

    return nr.slice(0, nextPicks[idx].length);
  });

  return { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay };
};

/** Returns `null` when there is no continuation to clear. */
export const nextPlanAfterClearWrapContinuation = (
  attacker: AttackerData,
  prev: AttackPlan,
  attackIndex: number,
): AttackPlan | null => {
  const row = prev.wrapPicks[attackIndex];

  if (row.length <= 1) {
    return null;
  }

  const pick0 = row[0];

  let cp0: CharacterPlayPickSlot =
    prev.characterPlayPicks[attackIndex]?.[0] ?? null;

  if (pick0 == null || !choiceUsesCharacterPlay(attacker, pick0)) {
    cp0 = null;
  }

  const nextPicks = prev.wrapPicks.map((r, idx) =>
    idx === attackIndex ? [pick0] : [...r],
  );

  const nextCharacterPlay = prev.characterPlayPicks.map((r, idx) =>
    idx === attackIndex ? [cp0] : [...r],
  );

  return { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay };
};

/** Returns `null` when the pick is unchanged. */
export const nextPlanAfterCharacterPlayPick = (
  attacker: AttackerData,
  prev: AttackPlan,
  attackIndex: number,
  pickIndex: number,
  pick: CharacterPlayPick,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): AttackPlan | null => {
  if (prev.characterPlayPicks[attackIndex]?.[pickIndex] === pick) {
    return null;
  }

  const nextCharacterPlay = prev.characterPlayPicks.map((row, idx) => {
    if (idx !== attackIndex) {
      return [...row];
    }

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
};
