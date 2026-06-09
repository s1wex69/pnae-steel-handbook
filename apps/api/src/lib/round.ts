export function roundTo(v: number, places: number): number {
  return Number(v.toFixed(places));
}

export function parseDecimalPlaces(value: unknown, fallback = 5): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0 || n > 10) {
    throw new Error("Количество знаков после запятой должно быть от 0 до 10");
  }
  return n;
}
