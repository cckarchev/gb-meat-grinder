import { describe, expect, it } from 'vitest';
import { gridEqual, rowEqual } from '@/core/shared/gridEqual';

describe('rowEqual', () => {
  it('matches rows with the same values in order', () => {
    expect(rowEqual(['a', null], ['a', null])).toBe(true);
  });

  it('rejects rows of different length or content', () => {
    expect(rowEqual(['a'], ['a', null])).toBe(false);
    expect(rowEqual(['a', 'b'], ['b', 'a'])).toBe(false);
  });
});

describe('gridEqual', () => {
  it('matches grids whose rows are all equal', () => {
    expect(gridEqual([['a'], []], [['a'], []])).toBe(true);
  });

  it('rejects grids with a different row count or a different row', () => {
    expect(gridEqual([['a']], [['a'], []])).toBe(false);
    expect(gridEqual([['a'], ['b']], [['a'], ['c']])).toBe(false);
  });
});
