import { describe, expect, it } from 'vitest';
import { guildColorStyle } from '@/styles/guildColorStyle';

describe('guildColorStyle', () => {
  it('sets the guild color custom property the CSS modules read', () => {
    expect(guildColorStyle('#b33')).toEqual({ '--guild-color': '#b33' });
  });
});
