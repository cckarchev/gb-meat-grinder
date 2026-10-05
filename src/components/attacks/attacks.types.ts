import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';

export type CharacterPlaySlotRef = {
  choiceId: PlaybookChoiceId;
  pickIndex: number;
};
