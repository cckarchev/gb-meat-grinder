/**
 * Effects earlier picks carry into later swings: cover, armor and Knock Down.
 */

import { activationAttackIndices } from '@/core/attackRows';
import { berserkerRowOffset } from '@/core/attackStructure';
import {
  characterPlayPickModifiers,
  characterPlayUsageBeforePick,
  defaultCharacterPlayId,
} from '@/core/characterPlayPicks';
import { choiceUsesCharacterPlay, getPlaybookResult } from '@/core/wrapSlots';
import type { AttackerData } from '@/types/core/attacker';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';

/** True if this pick removes the enemy's cover (a push / double push result). */
export const wrapPickClearsCover = (
  attacker: AttackerData,
  id: WrapPick | null | undefined,
): boolean => {
  if (id == null) {
    return false;
  }

  return getPlaybookResult(attacker, id).clearsCover === true;
};

/**
 * −1 ARM on this swing if an earlier swing's GB triggered a character play that
 * reduces ARM (e.g. They Ain't Tough!), in activation order (strictly earlier).
 * A condition, so it never stacks past 1.
 */
export const armorReductionBeforeAttack = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  activeBaseCount: number,
): number => {
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  const pos = order.indexOf(attackIndex);

  if (pos < 0) {
    return 0;
  }

  let reduction = 0;

  for (let oi = 0; oi < pos; oi++) {
    const j = order[oi];

    for (let k = 0; k < wrapPicks[j].length; k++) {
      if (wrapPicks[j][k] == null) {
        continue;
      }

      reduction += rowEffectsForPick(
        attacker,
        wrapPicks,
        characterPlayPicks,
        j,
        k,
        damageMods,
        activeBaseCount,
      ).armorReduction;
    }
  }

  return Math.min(1, reduction);
};

/**
 * Fixed GB swing order for cover: each base then its berserker, regardless of
 * whether the berserker row is “active” for damage (so > / >> are never skipped).
 */
export const coverSwingClockIndices = (
  attacker: AttackerData,
  activeBaseCount: number,
): number[] => {
  const out: number[] = [];
  const offset = berserkerRowOffset(attacker);

  for (let b = 0; b < activeBaseCount; b++) {
    out.push(b);

    if (attacker.berserker) {
      out.push(offset + b);
    }
  }

  return out;
};

/**
 * True if Knock Down is unavailable for this pick: either the target is already
 * Knocked Down before the activation, or KD was taken on a strictly earlier wrap
 * pick (activation order). Only one KD can ever apply.
 */
export const kdAlreadyTakenBeforePick = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  enemyKnockedDown = false,
): boolean => {
  if (enemyKnockedDown) {
    return true;
  }

  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  const targetPos = order.indexOf(attackIndex);

  if (targetPos < 0) {
    return false;
  }

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;

    for (let k = 0; k < kLimit; k++) {
      const id = wrapPicks[j][k];

      if (id != null && getPlaybookResult(attacker, id).appliesKnockDown) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Modifiers this pick adds to later swings (SO/Stagger each once; after both,
 * further GB / 1GB lines have no character-play effect).
 */
export const rowEffectsForPick = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): {
  tacBonusForLater: number;
  defReductionForLater: number;
  armorReduction: number;
} => {
  const none = {
    tacBonusForLater: 0,
    defReductionForLater: 0,
    armorReduction: 0,
  };

  const id = wrapPicks[attackIndex][pickIndex];

  if (id == null) {
    return none;
  }

  const result = getPlaybookResult(attacker, id);

  if (
    result.appliesKnockDown &&
    kdAlreadyTakenBeforePick(
      attacker,
      wrapPicks,
      attackIndex,
      pickIndex,
      damageMods,
      activeBaseCount,
    )
  ) {
    return none;
  }

  if (!choiceUsesCharacterPlay(attacker, id)) {
    return {
      tacBonusForLater: result.tacBonusForLater,
      defReductionForLater: result.defReductionForLater,
      armorReduction: 0,
    };
  }

  const used = characterPlayUsageBeforePick(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    pickIndex,
    damageMods,
    activeBaseCount,
  );

  const f =
    characterPlayPicks[attackIndex]?.[pickIndex] ??
    defaultCharacterPlayId(attacker);

  if (f == null || used.has(f)) {
    return none;
  }

  return characterPlayPickModifiers(attacker, f);
};
