import type { AttackerData } from '@/types/core/attacker';
import type { PlaybookChoiceId, PlaybookResult } from '@/types/core/playbook';

type PlaybookIndex = {
  byId: Map<PlaybookChoiceId, PlaybookResult>;
  /** Largest column cost on the card; wrap reserves this much net per “full” step. */
  maxNet: number;
};

const cache = new WeakMap<AttackerData, PlaybookIndex>();

const buildIndex = (attacker: AttackerData): PlaybookIndex => {
  const byId = new Map<PlaybookChoiceId, PlaybookResult>();

  for (const col of attacker.playbook) {
    for (const r of col.results) {
      byId.set(r.id, r);
    }
  }

  const maxNet = Math.max(...attacker.playbook.map((c) => c.netSuccesses));

  return { byId, maxNet };
};

/** Cached lookup table + widest column for an attacker's playbook. */
export const playbookIndex = (attacker: AttackerData): PlaybookIndex => {
  const cached = cache.get(attacker);

  if (cached) {
    return cached;
  }

  const idx = buildIndex(attacker);

  cache.set(attacker, idx);

  return idx;
};

export const maxPlaybookNet = (attacker: AttackerData): number => {
  return playbookIndex(attacker).maxNet;
};
