/** Расчёт толщины стенки колена (ИН № 8; Mathcad «Стенка колена») */

import {
  type ShellAllowances,
  type ShellSolveTarget,
  resolveShellAllowances,
} from "@/lib/shellCalcShared";

export type ElbowSteelClass = "carbon" | "crmov" | "austenitic";

const TEMP_LIMITS: Record<ElbowSteelClass, { low: number; high: number }> = {
  carbon: { low: 350, high: 400 },
  crmov: { low: 400, high: 450 },
  austenitic: { low: 450, high: 525 },
};

export function elbowSteelClassFromCategory(categoryId: string | null): ElbowSteelClass {
  if (categoryId === "pearlitic_crmo") return "crmov";
  if (categoryId === "austenitic" || categoryId === "high_chrome" || categoryId === "fe_ni") {
    return "austenitic";
  }
  return "carbon";
}

export interface ElbowInputs {
  Da: number;
  Rs: number;
  daMax: number;
  daMin: number;
  sigma: number;
  phiP: number;
  p: number;
  sp: number;
  temperatureC: number;
  steelClass: ElbowSteelClass;
  allowances: ShellAllowances;
  solveFor: ShellSolveTarget;
}

export interface ElbowCoefficients {
  K1: number;
  K2: number;
  K3: number;
  Y1: number;
  Y2: number;
  Y3: number;
  K: number;
  a: number;
  b: number;
  q: number;
}

export interface ElbowResults {
  c3: number;
  cc: number;
  sp: number;
  sp1: number;
  sp2: number;
  sp3: number;
  ss: number;
  p: number;
  pp: number;
  coeffs: ElbowCoefficients;
  rsRatio: number;
  applicabilityOk: boolean;
  applicabilityNote: string;
  error: string | null;
}

function clampMin1(v: number) {
  return v < 1 ? 1 : v;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function calcOvalityPercent(daMax: number, daMin: number): number {
  const sum = daMax + daMin;
  if (!(sum > 0)) return 0;
  return (2 * (daMax - daMin)) / sum * 100;
}

export function calcToroidalCoefficients(Rs: number, Da: number) {
  const K1 = (4 * Rs + Da) / (4 * Rs + 2 * Da);
  const K2 = (4 * Rs - Da) / (4 * Rs - 2 * Da);
  const K3 = 1;
  return { K1, K2, K3 };
}

export function calcB(p: number, sigma: number): number {
  const denom = 2 * sigma + p;
  if (!(denom > 0)) return 0;
  return p / denom;
}

export function calcQ(b: number, Rs: number, Da: number): number {
  if (!(Rs > 0) || !(Da > 0)) return 0;
  const raw = 2 * b * (Rs / Da) + 0.5;
  return raw > 1 ? 1 : raw;
}

function calcShapeAtLowTemp(a: number, b: number, q: number) {
  const ratio = b > 0 ? a / b : 0;
  const Y1 = clampMin1(0.12 * (1 + Math.sqrt(1 + 0.4 * ratio * q)));
  const Y3 = clampMin1(0.12 * (1 + Math.sqrt(1 + 0.4 * ratio)));
  return { Y1, Y2: Y1, Y3 };
}

function calcShapeAtHighTemp(a: number, b: number, q: number) {
  const ratio = b > 0 ? a / b : 0;
  const Y1 = clampMin1(0.4 * (1 + Math.sqrt(1 + 0.015 * ratio * q)));
  const Y3 = clampMin1(0.4 * (1 + Math.sqrt(1 + 0.015 * ratio)));
  return { Y1, Y2: Y1, Y3 };
}

export function calcShapeCoefficients(
  ovalityA: number,
  bRaw: number,
  q: number,
  temperatureC: number,
  steelClass: ElbowSteelClass
): Pick<ElbowCoefficients, "Y1" | "Y2" | "Y3" | "a" | "b" | "q"> {
  const a = Math.max(0, ovalityA);
  const b = bRaw < 0.03 ? 0.03 : bRaw;

  const low = calcShapeAtLowTemp(a, b, q);
  const high = calcShapeAtHighTemp(a, b, q);
  const limits = TEMP_LIMITS[steelClass];

  if (temperatureC <= limits.low) {
    return { ...low, a, b, q };
  }
  if (temperatureC >= limits.high) {
    return { ...high, a, b, q };
  }

  const t = (temperatureC - limits.low) / (limits.high - limits.low);
  return {
    Y1: lerp(low.Y1, high.Y1, t),
    Y2: lerp(low.Y2, high.Y2, t),
    Y3: lerp(low.Y3, high.Y3, t),
    a,
    b,
    q,
  };
}

export function calcElbowThicknessParts(
  p: number,
  Da: number,
  sigma: number,
  phiP: number,
  coeffs: Pick<ElbowCoefficients, "K1" | "K2" | "K3" | "Y1" | "Y2" | "Y3">
) {
  const { K1, K2, K3, Y1, Y2, Y3 } = coeffs;
  const denom = 2 * phiP * sigma + p;
  if (!(denom > 0) || !(Da > 0) || !(p > 0)) return null;

  const sp1 = (p * Da * Y1 * K1) / denom;
  const sp2 = (p * Da * Y2 * K2) / denom;
  const sp3 = (p * Da * Y3 * K3) / denom;
  const sp = Math.max(sp1, sp2, sp3);
  return { sp1, sp2, sp3, sp };
}

export function calcPressureFromSpPart(
  sp: number,
  Da: number,
  sigma: number,
  phiP: number,
  Y: number,
  K: number
): number | null {
  if (!(sp > 0) || !(Da > 0)) return null;
  const denom = Da * Y * K - sp;
  if (!(denom > 0)) return null;
  return (2 * sp * phiP * sigma) / denom;
}

export function calcPressureFromSp(
  sp: number,
  Da: number,
  sigma: number,
  phiP: number,
  coeffs: Pick<ElbowCoefficients, "K1" | "K2" | "K3" | "Y1" | "Y2" | "Y3">
): number | null {
  const p1 = calcPressureFromSpPart(sp, Da, sigma, phiP, coeffs.Y1, coeffs.K1);
  const p2 = calcPressureFromSpPart(sp, Da, sigma, phiP, coeffs.Y2, coeffs.K2);
  const p3 = calcPressureFromSpPart(sp, Da, sigma, phiP, coeffs.Y3, coeffs.K3);
  const values = [p1, p2, p3].filter((v): v is number => v != null);
  if (!values.length) return null;
  return Math.min(...values);
}

export function calcAllowablePressure(
  ss: number,
  cc: number,
  Da: number,
  sigma: number,
  phiP: number,
  K: number
): number | null {
  const sEff = ss - cc;
  if (!(sEff > 0)) return null;
  const denom = K * (Da - sEff);
  if (!(denom > 0)) return null;
  return (2 * sEff * phiP * sigma) / denom;
}

export function calculateElbow(input: ElbowInputs): ElbowResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const rsRatio = input.Da > 0 ? input.Rs / input.Da : 0;
  const applicabilityNote = "R_s / D_a ≥ 1";
  const base = {
    c3,
    cc,
    sp: input.sp,
    sp1: 0,
    sp2: 0,
    sp3: 0,
    ss: 0,
    p: input.p,
    pp: 0,
    coeffs: {
      K1: 0,
      K2: 0,
      K3: 1,
      Y1: 1,
      Y2: 1,
      Y3: 1,
      K: 1,
      a: 0,
      b: 0,
      q: 0,
    },
    rsRatio,
    applicabilityOk: rsRatio >= 1,
    applicabilityNote,
    error: null as string | null,
  };

  if (!(input.Da > 0) || !(input.Rs > 0)) {
    return { ...base, error: "Задайте D_a и R_s" };
  }

  const toroidal = calcToroidalCoefficients(input.Rs, input.Da);
  const ovalityA = calcOvalityPercent(input.daMax, input.daMin);
  const bRaw = calcB(input.p, input.sigma);
  const q = calcQ(bRaw, input.Rs, input.Da);
  const shape = calcShapeCoefficients(ovalityA, bRaw, q, input.temperatureC, input.steelClass);
  const K = Math.max(toroidal.K1 * shape.Y1, toroidal.K2 * shape.Y2, toroidal.K3 * shape.Y3);
  const coeffs: ElbowCoefficients = { ...toroidal, ...shape, K };

  let sp = input.sp;
  let p = input.p;
  let sp1 = 0;
  let sp2 = 0;
  let sp3 = 0;

  if (input.solveFor === "sp") {
    const parts = calcElbowThicknessParts(p, input.Da, input.sigma, input.phiP, coeffs);
    if (parts == null) {
      return { ...base, coeffs, error: "Невозможно рассчитать s_p: проверьте исходные данные" };
    }
    ({ sp1, sp2, sp3, sp } = parts);
  } else {
    const next = calcPressureFromSp(sp, input.Da, input.sigma, input.phiP, coeffs);
    if (next == null) {
      return { ...base, coeffs, error: "Невозможно рассчитать p: проверьте s_p, D_a, σ и φ" };
    }
    p = next;
    const parts = calcElbowThicknessParts(p, input.Da, input.sigma, input.phiP, coeffs);
    if (parts) ({ sp1, sp2, sp3 } = parts);
  }

  const ss = sp + cc;
  const pp = calcAllowablePressure(ss, cc, input.Da, input.sigma, input.phiP, K);

  if (pp == null) {
    return {
      ...base,
      sp,
      sp1,
      sp2,
      sp3,
      ss,
      p,
      coeffs,
      error: "Не удалось проверить допускаемое давление [p]",
    };
  }

  return {
    c3,
    cc,
    sp,
    sp1,
    sp2,
    sp3,
    ss,
    p,
    pp,
    coeffs,
    rsRatio,
    applicabilityOk: rsRatio >= 1,
    applicabilityNote,
    error: null,
  };
}
