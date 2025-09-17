export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function floorToTranslatePercent(floor: number, FLOORS: number) {
  const pct = ((FLOORS - floor) / (FLOORS - 1)) * 100;
  return pct;
}
