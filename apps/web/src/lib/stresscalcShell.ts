/** Формулы и прибавки как на stresscalc.ru (boiler/boiler.php, boiler/elbow.php) */

import type { ElbowSteelClass } from "@/lib/elbow";

const ELBOW_TEMP_LIMITS: Record<ElbowSteelClass, { low: number; high: number }> = {
  carbon: { low: 350, high: 400 },
  crmov: { low: 400, high: 450 },
  austenitic: { low: 450, high: 525 },
};

/** Класс стали для коэффициентов Y — как Type_Steel() в elbow.js stresscalc */
const ELBOW_STEEL_CLASS_MARKS: Record<Exclude<ElbowSteelClass, "carbon">, string[]> = {
  crmov: [
    "14ГНМА",
    "16ГНМ",
    "16ГНМА",
    "16ГС",
    "09Г2С",
    "10Г2С1",
    "17ГС",
    "17Г1С",
    "17Г1СУ",
    "15ГС",
    "12ХМ",
    "12МХ",
    "15ХМ",
    "12Х1МФ",
    "12Х2МФСР",
    "15Х1М1Ф",
    "12Х11В2МФ",
    "X10CrMoVNb9",
    "10Х9МФБ-Ш",
  ],
  austenitic: [
    "12Х18Н12Т",
    "12Х18Н10Т",
    "09Х14Н19В2БР",
    "09Х16Н14В2БР",
    "10Х16Н16В2МБР",
  ],
};

function normalizeSteelMark(mark: string) {
  return mark.trim().toUpperCase().replace(/\s+/g, "");
}

export function inferElbowSteelClassFromMark(mark: string): ElbowSteelClass {
  const key = normalizeSteelMark(mark);
  if (!key) return "carbon";
  for (const m of ELBOW_STEEL_CLASS_MARKS.austenitic) {
    if (normalizeSteelMark(m) === key) return "austenitic";
  }
  for (const m of ELBOW_STEEL_CLASS_MARKS.crmov) {
    if (normalizeSteelMark(m) === key) return "crmov";
  }
  return "carbon";
}

export function round2(v: number) {
  return +v.toFixed(2);
}

export function round1(v: number) {
  return +v.toFixed(1);
}

export function round3(v: number) {
  return +v.toFixed(3);
}

/** Минусовой допуск: 10 % s при Da ≤ 114, иначе 5 % (ТУ 14-3Р-55) */
export function stresscalcMinusTolerance(Da: number, s: number) {
  if (!(Da > 0) || !(s > 0)) return 0;
  const frac = Da <= 114 ? 0.1 : 0.05;
  return round2(frac * s);
}

/** Коррозионная прибавка: 1 мм; для колена при Da > 133 — 3 мм;
 *  для труб Da ≤ 32 мм — 0 (РД 10-249-98, п. 1.5.7) */
export function stresscalcCorrosionAllowance(Da: number, elbow: boolean) {
  if (!elbow && Da <= 32) return 0;
  if (elbow && Da > 133) return 3;
  return 1;
}

/** Технологическая прибавка c₁₂ для внешней зоны колена */
export function stresscalcElbowTechAllowance(s: number, Rs: number, Da: number) {
  if (!(s > 0) || !(Da > 0) || !(Rs > 0)) return 0;
  return round2(s / (1 + (2 * Rs) / Da));
}

export function stresscalcInterpY(lowY: number, highY: number, T: number, steelClass: ElbowSteelClass) {
  const limits = ELBOW_TEMP_LIMITS[steelClass];
  if (T <= limits.low) return lowY;
  if (T >= limits.high) return highY;
  const t = (T - limits.low) / (limits.high - limits.low);
  if (lowY < highY) return lowY + (highY - lowY) * t;
  return highY + (lowY - highY) * t;
}

export interface StresscalcElbowAllowances {
  c11: number;
  c12: number;
  c21: number;
}

export function resolveStresscalcElbowAllowances(a: StresscalcElbowAllowances) {
  const cc1 = round2(a.c11 + a.c12 + a.c21);
  const cc23 = round2(a.c11 + a.c21);
  return { cc1, cc23 };
}

/** [p] по зоне — как Pdop_i в elbow.js stresscalc */
export function calcStresscalcZoneAllowablePressure(
  s: number,
  cc: number,
  Ki: number,
  Yi: number,
  Da: number,
  sigma: number,
  phi: number
): number | null {
  const num = s - cc;
  if (!(num > 0) || !(Ki > 0) || !(Yi > 0) || !(Da > 0) || !(sigma > 0) || !(phi > 0)) return null;
  const t = num / (Ki * Yi);
  const denom = Da - t;
  if (!(denom > 0)) return null;
  return round1((2 * phi * sigma * t) / denom);
}
