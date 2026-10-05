import { describe, expect, it } from 'vitest';
import { isAttackIndex } from '@/core/shared/attackIndex';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';

describe('isAttackIndex', () => {
  it('accepts the first row and later rows', () => {
    expect(isAttackIndex(0)).toBe(true);
    expect(isAttackIndex(3)).toBe(true);
  });

  it('rejects the no-attack sentinel', () => {
    expect(isAttackIndex(NO_ATTACK_INDEX)).toBe(false);
  });
});
