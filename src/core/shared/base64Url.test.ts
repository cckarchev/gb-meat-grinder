import { describe, expect, it } from 'vitest';
import { fromBase64Url, toBase64Url } from '@/core/shared/base64Url';

describe('base64url', () => {
  it('round-trips text', () => {
    const text = '{"v":1,"w":[["m4","m2"],[null]]}';

    expect(fromBase64Url(toBase64Url(text))).toBe(text);
  });

  it('uses only URL-safe characters and no padding', () => {
    const encoded = toBase64Url('??>>~~a');

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('round-trips non-ASCII text', () => {
    const text = 'Señor ñandú';

    expect(fromBase64Url(toBase64Url(text))).toBe(text);
  });

  it('returns null for input that is not base64url', () => {
    expect(fromBase64Url('not base64!')).toBeNull();
  });
});
