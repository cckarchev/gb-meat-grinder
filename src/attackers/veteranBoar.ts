import { singledOut, stagger } from '@/characterPlays';
import { butchers } from '@/guilds/butchers';
import type { AttackerData } from '@/types/core/attacker';
import type { PlaybookColumn } from '@/types/core/playbook';

/**
 * Veteran Boar playbook: columns in card order. Each column needs `netSuccesses`
 * after ARM; `results` has 1–2 lines (a `|` on the card = two entries here).
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'push',
        label: '>',
        damage: 0,
        clearsCover: true,
      },
      {
        id: 'dmg1',
        label: '1',
        damage: 1,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 2,
    results: [
      {
        id: 'gb',
        label: 'GB',
        damage: 0,
        picksCharacterPlay: true,
      },
      {
        id: 'dmg2',
        label: '2',
        damage: 2,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 3,
    results: [
      {
        id: 'kd',
        label: 'KD',
        defReductionForLater: 1,
        damage: 0,
        appliesKnockDown: true,
      },
    ],
  },
  {
    netSuccesses: 4,
    results: [
      {
        id: 'push_push',
        label: '>>',
        damage: 0,
        clearsCover: true,
      },
      {
        id: 'dmg3',
        label: '3',
        damage: 3,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'one_gb',
        label: '1GB',
        damage: 1,
        picksCharacterPlay: true,
      },
      {
        id: 'tackle',
        label: 'T',
        damage: 0,
      },
    ],
  },
  {
    netSuccesses: 6,
    results: [
      {
        id: 'dmg5',
        label: '5',
        damage: 5,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 7,
    results: [
      {
        id: 'dmg6',
        label: '6',
        damage: 6,
        momentum: true,
      },
    ],
  },
] as const;

/**
 * Veteran Boar. Furious + Berserker, INF cap 2: with all 2 influence on attacks
 * and a (free) charge that is 3 base attacks, each able to spawn a Berserker —
 * the 3-base / 6-max layout the calculator originally hardcoded.
 */
export const veteranBoar: AttackerData = {
  id: 'veteran-boar',
  name: 'Veteran Boar',
  tac: 8,
  inf: 2,
  furious: true,
  berserker: true,
  playbook: PLAYBOOK,
  guild: butchers,
  characterPlays: [singledOut, stagger],
  startingMomentum: { min: 0, max: 20 },
  gangingUp: { min: 0, max: 5 },
  crowdingOut: { min: 0, max: 5 },
};
