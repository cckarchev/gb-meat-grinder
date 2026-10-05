/**
 * Playbook lookups by result id. Everything model-specific comes from the
 * `attacker` argument; the engine reads effect flags on results, never their
 * id strings.
 */

import type {
  PlaybookChoiceId,
  PlaybookResult,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

type PlaybookIndex = {
  byId: Map<PlaybookChoiceId, PlaybookResult>;
  /** Largest column cost on the card; wrap reserves this much net per “full” step. */
  maxNet: number;
};

const cache = new WeakMap<AttackerData, PlaybookIndex>();

const buildIndex = (attacker: AttackerData): PlaybookIndex => {
  const byId = new Map<PlaybookChoiceId, PlaybookResult>();

  for (const column of attacker.playbook) {
    for (const result of column.results) {
      byId.set(result.id, result);
    }
  }

  const maxNet = Math.max(
    ...attacker.playbook.map((column) => column.netSuccesses),
  );

  return { byId, maxNet };
};

/** Cached lookup table + widest column for an attacker's playbook. */
export const playbookIndex = (attacker: AttackerData): PlaybookIndex => {
  const cached = cache.get(attacker);

  if (cached) {
    return cached;
  }

  const index = buildIndex(attacker);

  cache.set(attacker, index);

  return index;
};

export const maxPlaybookNet = (attacker: AttackerData): number => {
  return playbookIndex(attacker).maxNet;
};

/** First line of the first playbook column: the fallback when nothing else fits. */
export const cheapestChoiceId = (attacker: AttackerData): PlaybookChoiceId => {
  return attacker.playbook[0].results[0].id;
};

export const getPlaybookResult = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
): PlaybookResult => {
  const result = playbookIndex(attacker).byId.get(id);

  if (!result) {
    throw new Error(`Unknown playbook id: ${id}`);
  }

  return result;
};

export const choiceUsesCharacterPlay = (
  attacker: AttackerData,
  id: WrapPick,
): id is PlaybookChoiceId => {
  if (id == null) {
    return false;
  }

  return getPlaybookResult(attacker, id).picksCharacterPlay === true;
};

export const netSuccessesForChoice = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
): number => {
  const column = attacker.playbook.find((candidate) => {
    return candidate.results.some((result) => result.id === id);
  });

  if (!column) {
    throw new Error(`No column for id ${id}`);
  }

  return column.netSuccesses;
};
