import { describe, expect, it } from 'vitest';
import {
  attackOrdinal,
  formatPercent,
  formatRange,
  formatSigned,
} from '@/core/shared/format';

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

describe('formatPercent', () => {
  it('formats with one decimal by default', () => {
    expect(formatPercent(0.5)).toBe('50.0%');
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('honors the digits argument', () => {
    expect(formatPercent(0.1234, 2)).toBe('12.34%');
  });

  it('collapses tiny positive values and non-finite input', () => {
    expect(formatPercent(0.00005)).toBe('<0.01%');
    expect(formatPercent(Number.NaN)).toBe('-');
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

describe('attackOrdinal', () => {
  it('numbers attacks from 1 for display', () => {
    expect(attackOrdinal(0)).toBe(1);
    expect(attackOrdinal(2)).toBe(3);
  });
});
