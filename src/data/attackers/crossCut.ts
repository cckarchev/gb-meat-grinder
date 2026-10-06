import type { PlaybookColumn } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import {
  CROWDING_OUT_RANGE,
  GANGING_UP_RANGE,
  STARTING_MOMENTUM_RANGE,
} from '@/data/attackers/statRanges';
import { theBiggerTheyAre } from '@/data/characterPlays';
import { lumberjacks } from '@/data/guilds/lumberjacks';

/**
 * Cross Cut playbook, from the card: `>;M`/`1;M`, `2;M`, `KD;M`/`3;M`,
 * `>>`/`4KD`, `CUP`/`5`, `6`. The net-5 cup icon pays for The Bigger They
 * Are... (`CP2` in the card data). His traits (Specialised Equipment, Early
 * Risers, Job's a Good'un) do not affect the attack math.
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'push',
        label: '>',
        damage: 0,
        momentum: true,
        clearsCover: true,
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
        id: 'kd',
        label: 'KD',
        defReductionForLater: 1,
        damage: 0,
        momentum: true,
        appliesKnockDown: true,
      },
      {
        id: 'm3',
        label: '3',
        damage: 3,
        momentum: true,
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
        id: 'four_kd',
        label: '4KD',
        defReductionForLater: 1,
        damage: 4,
        appliesKnockDown: true,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'cup',
        label: 'CUP',
        damage: 0,
        picksCharacterPlay: true,
      },
      {
        id: 'dmg5',
        label: '5',
        damage: 5,
      },
    ],
  },
  {
    netSuccesses: 6,
    results: [
      {
        id: 'dmg6',
        label: '6',
        damage: 6,
      },
    ],
  },
];

export const crossCut: AttackerData = {
  id: 'crossCut',
  name: 'Cross Cut',
  tac: 8,
  inf: 4,
  furious: false,
  berserker: false,
  feral: false,
  playbook: PLAYBOOK,
  guild: lumberjacks,
  characterPlays: [theBiggerTheyAre],
  startingMomentum: STARTING_MOMENTUM_RANGE,
  gangingUp: GANGING_UP_RANGE,
  crowdingOut: CROWDING_OUT_RANGE,
};
