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

export const CALC_HUNDREDTHS = 2;

/** Округление до сотых без принудительных нулей в конце (80.7 → «80.7», 80 → «80»). */
export function fmtHundredths(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return String(Number(n.toFixed(CALC_HUNDREDTHS)));
}

/** Число с заданным округлением и запятой как десятичным разделителем. */
export function fmtRu(n: number, digits: number = CALC_HUNDREDTHS): string {
  if (!Number.isFinite(n)) return "—";
  const s = digits === CALC_HUNDREDTHS ? fmtHundredths(n) : fmt(n, digits);
  return s.replace(".", ",");
}

/** То же, но с запятой как десятичным разделителем (0,07). */
export function fmtHundredthsRu(n: number): string {
  return fmtRu(n, CALC_HUNDREDTHS);
}

export function sumFmt(parts: string[], digits = 1): string {
  if (parts.every(isBlank)) return "";
  const sum = parts.reduce((acc, s) => acc + num(s), 0);
  if (digits === CALC_HUNDREDTHS) return fmtHundredths(sum);
  return fmt(sum, digits);
}

export function fmtIfSource(n: number, sourceRaw: string, digits = 1): string {
  if (isBlank(sourceRaw)) return "";
  return fmt(n, digits);
}
