/** Расчёт колена на внутреннее давление (п. 4.2.2.3–4.2.2.9) */

import { type ShellAllowances, resolveShellAllowances } from "@/lib/shellCalcShared";

export type ElbowSteelClass = "carbon" | "crmov" | "austenitic";

export const ELBOW_APPLICABILITY_THINNESS_LIMIT = 0.25;
export const ELBOW_B_MIN = 0.03;

const TEMP_LIMITS: Record<ElbowSteelClass, { low: number; high: number }> = {
  carbon: { low: 350, high: 400 },
  crmov: { low: 400, high: 450 },
  austenitic: { low: 450, high: 525 },
};

export interface ElbowInputs {
  Da: number;
  Rs: number;
  sigma: number;
  phi: number;
  p: number;
  /** Принятая номинальная толщина s */
  s: number;
  temperatureC: number;
  steelClass: ElbowSteelClass;
  /** Овальность поперечного сечения, % */
  ovalityA: number;
  allowances: ShellAllowances;
}

export interface ElbowResults {
  c3: number;
  cc: number;
  c2: number;
  sr1: number;
  sr2: number;
  sr3: number;
  srMax: number;
  sMin: number;
  pAllowDesign: number;
  pAllowMfg: number;
  rsRatio: number;
  rsApplicabilityOk: boolean;
  thinnessRatio: number;
  thinnessOk: boolean;
  thicknessOk: boolean;
  strengthOk: boolean;
  error: string | null;
}

function clampMin1(v: number) {
  return v < 1 ? 1 : v;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function calcToroidalCoefficients(Rs: number, Da: number) {
  const K1 = (4 * Rs + Da) / (4 * Rs + 2 * Da);
  const K2 = (4 * Rs - Da) / (4 * Rs - 2 * Da);
  const K3 = 1;
  return { K1, K2, K3 };
}

/** b = p / (2[σ] + p); при b < 0,03 принимают 0,03 */
export function calcElbowB(p: number, sigma: number): number {
  const raw = p / (2 * sigma + p);
  return raw < ELBOW_B_MIN ? ELBOW_B_MIN : raw;
}

/** q = 2·b·(Rₛ/Dₐ) + 0,5; при q > 1 принимают 1 */
export function calcElbowQ(b: number, Rs: number, Da: number): number {
  const raw = 2 * b * (Rs / Da) + 0.5;
  return raw > 1 ? 1 : raw;
}

function calcShapeAtLowTemp(a: number, b: number, q: number) {
  const ratio = a / b;
  const Y1 = clampMin1(0.12 * (1 + Math.sqrt(1 + 0.4 * ratio * q)));
  const Y3 = clampMin1(0.12 * (1 + Math.sqrt(1 + 0.4 * ratio)));
  return { Y1, Y2: Y1, Y3 };
}

function calcShapeAtHighTemp(a: number, b: number, q: number) {
  const Y1 = clampMin1(0.4 * (1 + Math.sqrt(1 + 0.015 * (a * q) / b)));
  const Y3 = clampMin1(0.4 * (1 + Math.sqrt(1 + 0.015 * a / b)));
  return { Y1, Y2: Y1, Y3 };
}

export function calcShapeCoefficients(
  p: number,
  sigma: number,
  Rs: number,
  Da: number,
  temperatureC: number,
  steelClass: ElbowSteelClass,
  ovalityA: number
) {
  const b = calcElbowB(p, sigma);
  const q = calcElbowQ(b, Rs, Da);
  const a = Math.max(0, ovalityA);

  const low = calcShapeAtLowTemp(a, b, q);
  const high = calcShapeAtHighTemp(a, b, q);
  const limits = TEMP_LIMITS[steelClass];

  if (temperatureC <= limits.low) {
    return { ...low, b, q };
  }
  if (temperatureC >= limits.high) {
    return { ...high, b, q };
  }

  const t = (temperatureC - limits.low) / (limits.high - limits.low);
  return {
    Y1: lerp(low.Y1, high.Y1, t),
    Y2: lerp(low.Y2, high.Y2, t),
    Y3: lerp(low.Y3, high.Y3, t),
    b,
    q,
  };
}

export function calcElbowSr(
  p: number,
  Da: number,
  sigma: number,
  phi: number,
  Y: number,
  K: number
): number | null {
  const denom = 2 * phi * sigma + p;
  if (!(denom > 0) || !(Da > 0)) return null;
  return (p * Da * Y * K) / denom;
}

export function calcElbowCombinedK(
  K1: number,
  K2: number,
  K3: number,
  Y1: number,
  Y2: number,
  Y3: number
) {
  return Math.max(K1 * Y1, K2 * Y2, K3 * Y3);
}

export function calcElbowAllowablePressure(
  sEff: number,
  Da: number,
  sigma: number,
  phi: number,
  K: number
): number | null {
  const denom = K * Da - sEff;
  if (!(sEff > 0) || !(denom > 0)) return null;
  return (2 * sEff * phi * sigma) / denom;
}

export function calculateElbow(input: ElbowInputs): ElbowResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const c2 = input.allowances.c2;
  const rsRatio = input.Da > 0 ? input.Rs / input.Da : 0;
  const rsApplicabilityOk = rsRatio >= 1;

  const base: ElbowResults = {
    c3,
    cc,
    c2,
    sr1: 0,
    sr2: 0,
    sr3: 0,
    srMax: 0,
    sMin: 0,
    pAllowDesign: 0,
    pAllowMfg: 0,
    rsRatio,
    rsApplicabilityOk,
    thinnessRatio: 0,
    thinnessOk: false,
    thicknessOk: false,
    strengthOk: false,
    error: null,
  };

  if (!rsApplicabilityOk) {
    return { ...base, error: "Не выполнено условие Rₛ / Dₐ ≥ 1" };
  }

  const toroidal = calcToroidalCoefficients(input.Rs, input.Da);
  const shape = calcShapeCoefficients(
    input.p,
    input.sigma,
    input.Rs,
    input.Da,
    input.temperatureC,
    input.steelClass,
    input.ovalityA
  );
  const K = calcElbowCombinedK(
    toroidal.K1,
    toroidal.K2,
    toroidal.K3,
    shape.Y1,
    shape.Y2,
    shape.Y3
  );

  const sr1 = calcElbowSr(input.p, input.Da, input.sigma, input.phi, shape.Y1, toroidal.K1);
  const sr2 = calcElbowSr(input.p, input.Da, input.sigma, input.phi, shape.Y2, toroidal.K2);
  const sr3 = calcElbowSr(input.p, input.Da, input.sigma, input.phi, shape.Y3, toroidal.K3);

  if (sr1 == null || sr2 == null || sr3 == null) {
    return { ...base, error: "Невозможно рассчитать расчётные толщины: проверьте исходные данные" };
  }

  const srMax = Math.max(sr1, sr2, sr3);
  const sMin = srMax + cc;
  const sUsed = input.s > 0 ? input.s : sMin;
  const sEffDesign = sUsed - cc;
  const thinnessRatio = input.Da > 0 ? sEffDesign / input.Da : 0;
  const thinnessOk = thinnessRatio <= ELBOW_APPLICABILITY_THINNESS_LIMIT;

  const pAllowDesign =
    input.s > 0
      ? calcElbowAllowablePressure(sEffDesign, input.Da, input.sigma, input.phi, K)
      : null;
  const pAllowMfg =
    input.s > 0
      ? calcElbowAllowablePressure(sUsed - c2, input.Da, input.sigma, input.phi, K)
      : null;

  if (input.s > 0 && (pAllowDesign == null || pAllowMfg == null)) {
    return {
      ...base,
      sr1,
      sr2,
      sr3,
      srMax,
      sMin,
      thinnessRatio,
      thinnessOk,
      error: "Не удалось рассчитать допускаемое давление",
    };
  }

  return {
    c3,
    cc,
    c2,
    sr1,
    sr2,
    sr3,
    srMax,
    sMin,
    pAllowDesign: pAllowDesign ?? 0,
    pAllowMfg: pAllowMfg ?? 0,
    rsRatio,
    rsApplicabilityOk,
    thinnessRatio,
    thinnessOk,
    thicknessOk: input.s <= 0 || input.s >= sMin,
    strengthOk: input.s > 0 && pAllowDesign != null ? input.p <= pAllowDesign : false,
    error: null,
  };
}
