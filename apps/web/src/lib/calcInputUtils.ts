export function isBlank(raw: string): boolean {
  const t = raw.trim();
  return t === "" || t === "-" || t === ".";
}

export function num(raw: string, fallback = 0): number {
  if (isBlank(raw)) return fallback;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export function fmt(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

/** Округление ввода до сотых; не форматирует незавершённый ввод (например «10.»). */
export function normalizeHundredths(raw: string): string {
  const normalized = raw.replace(",", ".");
  const t = normalized.trim();
  if (t === "" || t === "-" || t.endsWith(".")) return normalized;
  const n = Number(t);
  if (!Number.isFinite(n)) return normalized;
  return fmt(n, 2);
}

export const CALC_HUNDREDTHS = 2;

export function sumFmt(parts: string[], digits = 1): string {
  if (parts.every(isBlank)) return "";
  return fmt(parts.reduce((acc, s) => acc + num(s), 0), digits);
}

export function fmtIfSource(n: number, sourceRaw: string, digits = 1): string {
  if (isBlank(sourceRaw)) return "";
  return fmt(n, digits);
}
