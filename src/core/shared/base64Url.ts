/** URL-safe base64 (RFC 4648 §5) of UTF-8 text, without padding. */

const BASE64_BLOCK_LENGTH = 4;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]*$/;

export const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    '',
  );

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/** The decoded text, or `null` when `encoded` is not valid base64url UTF-8. */
export const fromBase64Url = (encoded: string): string | null => {
  if (!BASE64_URL_PATTERN.test(encoded)) {
    return null;
  }

  const remainder = encoded.length % BASE64_BLOCK_LENGTH;
  const padding =
    remainder === 0 ? '' : '='.repeat(BASE64_BLOCK_LENGTH - remainder);
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/') + padding;

  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
};
