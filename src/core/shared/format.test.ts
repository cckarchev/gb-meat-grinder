import { describe, expect, it } from 'vitest';
import { formatRange, formatSigned } from '@/core/shared/format';

describe('formatSigned', () => {
  it('prefixes a positive value with a plus sign', () => {
    expect(formatSigned(3)).toBe('+3');
  });

  it('keeps the minus sign of a negative value', () => {
    expect(formatSigned(-2)).toBe('-2');
  });

  it('shows zero without a sign', () => {
    expect(formatSigned(0)).toBe('0');
  });

  it('shows negative zero without a sign', () => {
    expect(formatSigned(-0)).toBe('0');
  });
});

describe('formatRange', () => {
  it('joins distinct bounds with a hyphen', () => {
    expect(formatRange({ low: 2, high: 7 })).toBe('2-7');
  });

  it('collapses equal bounds to a single value', () => {
    expect(formatRange({ low: 4, high: 4 })).toBe('4');
  });
});
