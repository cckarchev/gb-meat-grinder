import type { AttackerData } from '@/types/core/attacker';
import type { PlaybookColumn } from '@/types/core/playbook';

/**
 * Windle playbook. All damage results are momentous. The momentous-2 on column
 * 3 also has a GB, but Windle's character play is irrelevant to attacking, so it
 * is modelled as a plain momentous-2 (no character-play menu).
 */
const PLAYBOOK: readonly PlaybookColumn[] = [
  {
    netSuccesses: 1,
    results: [
      {
        id: 'm2',
        label: '2',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 2,
        momentum: true,
      },
      {
        id: 'push',
        label: '>',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
        clearsCover: true,
      },
    ],
  },
  {
    netSuccesses: 2,
    results: [
      {
        id: 'm3',
        label: '3',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 3,
        momentum: true,
      },
      {
        id: 'kd',
        label: 'KD',
        tacBonusForLater: 0,
        defReductionForLater: 1,
        damage: 0,
        appliesKnockDown: true,
      },
    ],
  },
  {
    netSuccesses: 3,
    results: [
      {
        id: 'm2_gb',
        label: '2',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 2,
        momentum: true,
      },
      {
        id: 'push_push',
        label: '>>',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 0,
        clearsCover: true,
      },
    ],
  },
  {
    netSuccesses: 4,
    results: [
      {
        id: 'm4',
        label: '4',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 4,
        momentum: true,
      },
    ],
  },
  {
    netSuccesses: 5,
    results: [
      {
        id: 'm5',
        label: '5',
        tacBonusForLater: 0,
        defReductionForLater: 0,
        damage: 5,
        momentum: true,
      },
    ],
  },
] as const;

export const windle: AttackerData = {
  id: 'windle',
  name: 'Windle',
  tac: 6,
  inf: 2,
  furious: false,
  berserker: true,
  feral: false,
  playbook: PLAYBOOK,
  buffs: [
    {
      id: 'theyAintTough',
      label: "They Ain't Tough!",
      tooltip: 'The enemy model suffers -1 ARM.',
      armorReduction: 1,
    },
    {
      id: 'weakPoint',
      label: 'Weak Point',
      tooltip: 'The enemy model suffers -1 ARM (stacks with They Ain\'t Tough!).',
      armorReduction: 1,
    },
    {
      id: 'ourToolsAreSharp',
      label: 'Our Tools Are Sharp',
      tooltip:
        'Playbook damage becomes Condition Damage, ignoring the enemy\'s Tough Hide.',
      ignoresToughHide: true,
    },
  ],
  startingMomentum: { min: 0, max: 20 },
  initialTacModifier: { min: -5, max: 5 },
};
