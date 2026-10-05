/** HSL hue at p = 1 (green). p = 0 maps to hue 0 (red). */
const HEAT_HUE_MAX = 118;
const HEAT_SATURATION = '62%';
const HEAT_LIGHTNESS_MIN = 36;
const HEAT_LIGHTNESS_RANGE = 16;

/** Above this probability the heat background is light enough for dark text. */
const DARK_TEXT_THRESHOLD = 0.52;
const DARK_TEXT = '#0a0a0a';
const LIGHT_TEXT = '#f8fafc';

const BORDER_SATURATION = '55%';
const BORDER_LIGHTNESS = '20%';
const BORDER_ALPHA_MIN = 0.25;
const BORDER_ALPHA_RANGE = 0.45;

const clampUnit = (p: number): number => {
  return Math.min(1, Math.max(0, p));
};

const heatHue = (t: number): number => {
  return Math.round(t * HEAT_HUE_MAX);
};

/** Map probability to red (0) → green (1) for heat styling. */
export const probHeatBackground = (p: number): string => {
  const t = clampUnit(p);
  const light = HEAT_LIGHTNESS_MIN + t * HEAT_LIGHTNESS_RANGE;

  return `hsl(${heatHue(t)} ${HEAT_SATURATION} ${light}%)`;
};

export const probHeatTextColor = (p: number): string => {
  const t = clampUnit(p);

  return t > DARK_TEXT_THRESHOLD ? DARK_TEXT : LIGHT_TEXT;
};

export const probHeatBorder = (p: number): string => {
  const t = clampUnit(p);
  const alpha = BORDER_ALPHA_MIN + t * BORDER_ALPHA_RANGE;

  return `hsla(${heatHue(t)} ${BORDER_SATURATION} ${BORDER_LIGHTNESS} / ${alpha})`;
};
