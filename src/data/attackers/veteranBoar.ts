import type { PlaybookColumn } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import {
  CROWDING_OUT_RANGE,
  GANGING_UP_RANGE,
  STARTING_MOMENTUM_RANGE,
} from '@/data/attackers/statRanges';
import { singledOut, stagger } from '@/data/characterPlays';
import { butchers } from '@/data/guilds/butchers';

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
        stealsBall: true,
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
];

/**
 * Veteran Boar. Furious + Berserker, INF cap 2: with all 2 influence on attacks
 * and a (free) charge that is 3 base attacks, each able to spawn a Berserker.
 */
export const veteranBoar: AttackerData = {
  id: 'veteran-boar',
  name: 'Veteran Boar',
  tac: 8,
  inf: 2,
  furious: true,
  berserker: true,
  feral: false,
  playbook: PLAYBOOK,
  guild: butchers,
  characterPlays: [singledOut, stagger],
  // Butchery, Get 'Em Lads! and They Ain't Tough! come from Ox, a captain like
  // him, so they cannot share a team. The Owner can still come from Veteran Ox.
  excludedGuildBuffs: ['butchery', 'getEmLads', 'theyAintTough'],
  startingMomentum: STARTING_MOMENTUM_RANGE,
  gangingUp: GANGING_UP_RANGE,
  crowdingOut: CROWDING_OUT_RANGE,
};
