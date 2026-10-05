import { describe, expect, it } from 'vitest';
import { dataFlag } from '@/styles/dataFlag';

describe('dataFlag', () => {
  it('renders an empty attribute value when the flag is on', () => {
    expect(dataFlag(true)).toBe('');
  });

  it('drops the attribute when the flag is off', () => {
    expect(dataFlag(false)).toBeUndefined();
  });
});
