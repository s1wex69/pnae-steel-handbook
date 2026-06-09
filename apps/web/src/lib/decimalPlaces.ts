const STORAGE_PREFIX = "calc-decimal-places";

export const DEFAULT_DECIMAL_PLACES = 5;

export function clampDecimalPlaces(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_DECIMAL_PLACES;
  return Math.min(10, Math.max(0, Math.round(n)));
}

export function loadDecimalPlaces(calcId: string): number {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}-${calcId}`);
    if (raw == null) return DEFAULT_DECIMAL_PLACES;
    return clampDecimalPlaces(Number(raw));
  } catch {
    return DEFAULT_DECIMAL_PLACES;
  }
}

export function saveDecimalPlaces(calcId: string, places: number): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}-${calcId}`, String(clampDecimalPlaces(places)));
  } catch {
    /* ignore */
  }
}
