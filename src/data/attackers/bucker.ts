import type { PlaybookColumn } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import {
  CROWDING_OUT_RANGE,
  GANGING_UP_RANGE,
  STARTING_MOMENTUM_RANGE,
} from '@/data/attackers/statRanges';
import { axeAQuestion, hoistingAndHauling } from '@/data/characterPlays';
import { anatomicalPrecision } from '@/data/characterTraits';
import { lumberjacks } from '@/data/guilds/lumberjacks';

/**
 * Bucker playbook, from the card: `GB;M`/`1;M`, `>;M`/`2;M`, `T;M`/`KD;M`,
 * `3`, `>>`/`4`. The net-1 GB icon pays for his plays (`CP` in the card
 * data): Axe A Question grants Assist for later swings, Hoisting and Hauling
 * does nothing to the attack math. Of his traits only Anatomical Precision
 * does; Splitting Strikes damages another enemy and Hew Do They Think They Are
 * grants Poised.
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'gb',
        label: 'GB',
        damage: 0,
        momentum: true,
        picksCharacterPlay: true,
      },
      {
        id: 'm1',
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
        id: 'push',
        label: '>',
        damage: 0,
        momentum: true,
        clearsCover: true,
      },
      {
        id: 'm2',
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
        id: 'tackle',
        label: 'T',
        damage: 0,
        stealsBall: true,
        momentum: true,
      },
      {
        id: 'kd',
        label: 'KD',
        defReductionForLater: 1,
        damage: 0,
        momentum: true,
        appliesKnockDown: true,
      },
    ],
  },
  {
    netSuccesses: 4,
    results: [
      {
        id: 'dmg3',
        label: '3',
        damage: 3,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'push_push',
        label: '>>',
        damage: 0,
        clearsCover: true,
      },
      {
        id: 'dmg4',
        label: '4',
        damage: 4,
      },
    ],
  },
];

export const bucker: AttackerData = {
  id: 'bucker',
  name: 'Bucker',
  tac: 5,
  inf: 4,
  furious: false,
  berserker: false,
  feral: false,
  playbook: PLAYBOOK,
  guild: lumberjacks,
  characterPlays: [hoistingAndHauling, axeAQuestion],
  characterTraits: [anatomicalPrecision],
  startingMomentum: STARTING_MOMENTUM_RANGE,
  gangingUp: GANGING_UP_RANGE,
  crowdingOut: CROWDING_OUT_RANGE,
};
