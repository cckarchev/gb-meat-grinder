import type {
  PlaybookChoiceId,
  PlaybookResult,
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
