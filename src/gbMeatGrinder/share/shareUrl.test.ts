import { describe, expect, it } from 'vitest';
import { buildShareUrl, validEmbedBase } from '@/gbMeatGrinder/share/shareUrl';

const CCK_PAGE = 'https://www.cckarchev.ar/juegos/guild-ball/meat-grinder';
const APP_URL = 'https://gbmeatgrinder.netlify.app/';

describe('embed base', () => {
  it('accepts the cckarchev site over https', () => {
    expect(validEmbedBase(CCK_PAGE)).toBe(CCK_PAGE);
    expect(validEmbedBase('https://cckarchev.ar/x')).toBe(
      'https://cckarchev.ar/x',
    );
  });

  it('accepts loopback hosts over http for local testing', () => {
    expect(validEmbedBase('http://localhost:4321/x')).toBe(
      'http://localhost:4321/x',
    );
    expect(validEmbedBase('http://127.0.0.1:4321/x')).toBe(
      'http://127.0.0.1:4321/x',
    );
  });

  it('rejects other hosts, plain http and garbage', () => {
    expect(validEmbedBase('https://evil.example/x')).toBeNull();
    expect(validEmbedBase('http://www.cckarchev.ar/x')).toBeNull();
    expect(validEmbedBase('not a url')).toBeNull();
    expect(validEmbedBase(null)).toBeNull();
  });
});

describe('share url', () => {
  const params = new URLSearchParams({ model: 'thresher', s: 'abc' });

  it('links to the app itself when not embedded', () => {
    expect(buildShareUrl(params, APP_URL, null)).toBe(
      'https://gbmeatgrinder.netlify.app/?model=thresher&s=abc',
    );
  });

  it('links to the embedding cckarchev page when embedded', () => {
    expect(buildShareUrl(params, APP_URL, CCK_PAGE)).toBe(
      `${CCK_PAGE}?model=thresher&s=abc`,
    );
  });
});
