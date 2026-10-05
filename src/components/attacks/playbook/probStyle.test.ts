import { describe, expect, it } from 'vitest';
import {
  probHeatBackground,
  probHeatBorder,
  probHeatTextColor,
} from '@/components/attacks/playbook/probStyle';

describe('probHeatBackground', () => {
  it('runs from red at 0 to green at 1 and clamps outside', () => {
    expect(probHeatBackground(0)).toBe('hsl(0 62% 36%)');
    expect(probHeatBackground(1)).toBe('hsl(118 62% 52%)');
    expect(probHeatBackground(2)).toBe(probHeatBackground(1));
    expect(probHeatBackground(-1)).toBe(probHeatBackground(0));
  });
});

describe('probHeatTextColor', () => {
  it('switches to dark text above 0.52', () => {
    expect(probHeatTextColor(0.52)).toBe('#f8fafc');
    expect(probHeatTextColor(0.53)).toBe('#0a0a0a');
  });
});

describe('probHeatBorder', () => {
  it('scales hue and alpha with probability', () => {
    expect(probHeatBorder(0)).toBe('hsla(0 55% 20% / 0.25)');
    expect(probHeatBorder(1)).toBe('hsla(118 55% 20% / 0.7)');
  });
});
