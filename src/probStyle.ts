/** Map probability to red (0) → green (1) for heat styling. */
export function probHeatBackground(p: number): string {
  const t = Math.min(1, Math.max(0, p))
  const hue = Math.round(t * 118)
  const light = 36 + t * 16
  return `hsl(${hue} 62% ${light}%)`
}

export function probHeatTextColor(p: number): string {
  const t = Math.min(1, Math.max(0, p))
  return t > 0.52 ? '#0a0a0a' : '#f8fafc'
}

export function probHeatBorder(p: number): string {
  const t = Math.min(1, Math.max(0, p))
  const alpha = 0.25 + t * 0.45
  return `hsla(${Math.round(t * 118)} 55% 20% / ${alpha})`
}
