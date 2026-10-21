import { describe, expect, it } from 'vitest';
import { buildShareUrl } from '@/gbMeatGrinder/share/shareUrl';

const APP_URL = 'https://gb-meat-grinder.cckarchev.ar/';

describe('share url', () => {
  it('links to the app with the share params', () => {
    const params = new URLSearchParams({ model: 'thresher', s: 'abc' });

    expect(buildShareUrl(params, APP_URL)).toBe(
      'https://gb-meat-grinder.cckarchev.ar/?model=thresher&s=abc',
    );
  });
});
