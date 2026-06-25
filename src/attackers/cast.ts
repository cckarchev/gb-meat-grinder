import { shieldGlare } from '@/characterPlays';
import { blacksmiths } from '@/guilds/blacksmiths';
import type { AttackerData } from '@/types/core/attacker';
import type { PlaybookColumn } from '@/types/core/playbook';

/**
 * Cast playbook. Momentous damage on net 2 / 4 / 6; the net-2 result also picks
 * a character play (Shield Glare / Shield Throw), and the net-5 GB picks one
 * without dealing damage. `<` (dodge), `T` (tackle) and `><` (push + dodge) are
 * mapped but do nothing for the attack math.
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'dodge',
        label: '<',
        damage: 0,
      },
      {
        id: 'dmg1',
        label: '1',
        damage: 1,
      },
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
      {
        id: 'tackle',
        label: 'T',
        damage: 0,
      },
      {
        id: 'push_dodge',
        label: '><',
        damage: 0,
        clearsCover: true,
      },
    ],
  },
  {
    netSuccesses: 4,
    results: [
      {
        id: 'dmg4',
        label: '4',
        damage: 4,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'five_gb',
        label: 'GB',
        damage: 0,
        picksCharacterPlay: true,
        clearsCover: true,
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
        momentum: true,
      },
    ],
  },
] as const;

/**
 * Cast. TAC 5, INF cap 4, no Furious/Berserker/Feral. Her Burning Passion adds +1 
 * to each damaging line while the target is Burning before the swing; in Furnace's
 * Tempered Steel aura she gains +1 TAC and Searing Strike, which lights the target
 * after her first damaging hit so later swings deal the +1 and hit at −1 ARM.
 */
export const cast: AttackerData = {
  id: 'cast',
  name: 'Cast',
  tac: 5,
  inf: 4,
  playbook: PLAYBOOK,
  guild: blacksmiths,
  characterPlays: [shieldGlare],
  burningPassion: true,
  startingMomentum: { min: 0, max: 20 },
  gangingUp: { min: 0, max: 5 },
  crowdingOut: { min: 0, max: 5 },
};
