import { describe, expect, it } from 'vitest';
import { joinClassNames } from '@/styles/joinClassNames';

describe('joinClassNames', () => {
  it('joins every class name with a space', () => {
    expect(joinClassNames('panel', 'enemyPanel')).toBe('panel enemyPanel');
  });

  it('skips missing class names', () => {
    expect(joinClassNames('panel', undefined)).toBe('panel');
  });

  it('skips empty class names', () => {
    expect(joinClassNames('', 'panel', '')).toBe('panel');
  });
});
