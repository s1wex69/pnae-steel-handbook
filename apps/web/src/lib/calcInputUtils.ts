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

export function sumFmt(parts: string[], digits = 1): string {
  if (parts.every(isBlank)) return "";
  return fmt(parts.reduce((acc, s) => acc + num(s), 0), digits);
}

export function fmtIfSource(n: number, sourceRaw: string, digits = 1): string {
  if (isBlank(sourceRaw)) return "";
  return fmt(n, digits);
}
