import type { PlaybookColumn } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import {
  CROWDING_OUT_RANGE,
  GANGING_UP_RANGE,
  STARTING_MOMENTUM_RANGE,
} from '@/data/attackers/statRanges';
import { shieldGlare, shieldThrow } from '@/data/characterPlays';
import { burningPassion } from '@/data/characterTraits';
import { blacksmiths } from '@/data/guilds/blacksmiths';

/** Cast playbook, from the card: `<`/`1`, `2,CP;M`, `T`/`><`, `4;M`, `CP,><`, `6;M`. */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      { id: 'dodge', label: '<', damage: 0 },
      { id: 'dmg1', label: '1', damage: 1 },
    ],
  },
  {
    netSuccesses: 2,
    results: [
      {
        id: 'two_gb',
        label: '2GB',
        damage: 2,
        momentum: true,
        picksCharacterPlay: true,
      },
    ],
  },
  {
    netSuccesses: 3,
    results: [
      { id: 'tackle', label: 'T', damage: 0 },
      { id: 'push_dodge', label: '><', damage: 0, clearsCover: true },
    ],
  },
  {
    netSuccesses: 4,
    results: [{ id: 'dmg4', label: '4', damage: 4, momentum: true }],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'gb_push_dodge',
        label: 'GB><',
        damage: 0,
        picksCharacterPlay: true,
        clearsCover: true,
      },
    ],
  },
  {
    netSuccesses: 6,
    results: [{ id: 'dmg6', label: '6', damage: 6, momentum: true }],
  },
];

export const cast: AttackerData = {
  id: 'cast',
  name: 'Cast',
  tac: 5,
  inf: 4,
  furious: false,
  berserker: false,
  feral: false,
  playbook: PLAYBOOK,
  guild: blacksmiths,
  characterPlays: [shieldGlare, shieldThrow],
  characterTraits: [burningPassion],
  excludedGuildBuffs: ['shieldGlare'],
  startingMomentum: STARTING_MOMENTUM_RANGE,
  gangingUp: GANGING_UP_RANGE,
  crowdingOut: CROWDING_OUT_RANGE,
};
