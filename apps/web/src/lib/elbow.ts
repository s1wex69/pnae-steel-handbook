/** Расчёт колена на внутреннее давление — логика stresscalc.ru/boiler/elbow.php (ПНАЭ п. 4.2.2.3–4.2.2.9) */

import {
  calcStresscalcZoneAllowablePressure,
  resolveStresscalcElbowAllowances,
  round2,
  stresscalcInterpY,
  type StresscalcElbowAllowances,
} from "@/lib/stresscalcShell";

export type ElbowSteelClass = "carbon" | "crmov" | "austenitic";

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
  s: number;
  temperatureC: number;
  steelClass: ElbowSteelClass;
  /** Овальность поперечного сечения, % */
  ovalityA: number;
  allowances: StresscalcElbowAllowances;
}

export interface ElbowResults {
  c11: number;
  c12: number;
  c21: number;
  cc1: number;
  cc23: number;
  sr: number;
  sr1: number;
  sr2: number;
  sr3: number;
  src1: number;
  src2: number;
  src3: number;
  srcMax: number;
  sMinWall: number;
  pAllow1: number;
  pAllow2: number;
  pAllow3: number;
  pAllow: number;
  thicknessOk: boolean;
  strengthOk: boolean;
  error: string | null;
}

function clampMin1(v: number) {
  return v < 1 ? 1 : v;
}

export function calcToroidalCoefficients(Rs: number, Da: number) {
  const K1 = (4 * Rs + Da) / (4 * Rs + 2 * Da);
  const K2 = (4 * Rs - Da) / (4 * Rs - 2 * Da);
  const K3 = 1;
  return { K1, K2, K3 };
}

export function calcElbowB(p: number, sigma: number): number {
  const raw = p / (2 * sigma + p);
  return raw < ELBOW_B_MIN ? ELBOW_B_MIN : raw;
}

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

  const Y1 = stresscalcInterpY(low.Y1, high.Y1, temperatureC, steelClass);
  const Y3 = stresscalcInterpY(low.Y3, high.Y3, temperatureC, steelClass);
  const Y2 = Y1;

  return {
    Y1: clampMin1(Y1),
    Y2: clampMin1(Y2),
    Y3: clampMin1(Y3),
    b,
    q,
  };
}

export function calcElbowBaseSr(p: number, Da: number, sigma: number, phi: number) {
  const denom = 2 * phi * sigma + p;
  if (!(denom > 0) || !(Da > 0)) return null;
  return round2((p * Da) / denom);
}

export function calculateElbow(input: ElbowInputs): ElbowResults {
  const { c11, c12, c21 } = input.allowances;
  const { cc1, cc23 } = resolveStresscalcElbowAllowances(input.allowances);

  const base: ElbowResults = {
    c11,
    c12,
    c21,
    cc1,
    cc23,
    sr: 0,
    sr1: 0,
    sr2: 0,
    sr3: 0,
    src1: 0,
    src2: 0,
    src3: 0,
    srcMax: 0,
    sMinWall: 0,
    pAllow1: 0,
    pAllow2: 0,
    pAllow3: 0,
    pAllow: 0,
    thicknessOk: false,
    strengthOk: false,
    error: null,
  };

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

  const sr = calcElbowBaseSr(input.p, input.Da, input.sigma, input.phi);
  if (sr == null) {
    return { ...base, error: "Невозможно рассчитать sᵣ: проверьте исходные данные" };
  }

  const sr1 = round2(sr * toroidal.K1 * shape.Y1);
  const sr2 = round2(sr * toroidal.K2 * shape.Y2);
  const sr3 = round2(sr * toroidal.K3 * shape.Y3);

  const src1 = round2(sr1 + cc1);
  const src2 = round2(sr2 + cc23);
  const src3 = round2(sr3 + cc23);
  const srcMax = Math.max(src1, src2, src3);

  const sMinWall = input.s > 0 ? round2(input.s - c11 - c12) : 0;

  const pAllow1 =
    input.s > 0
      ? calcStresscalcZoneAllowablePressure(
          input.s,
          cc1,
          toroidal.K1,
          shape.Y1,
          input.Da,
          input.sigma,
          input.phi
        )
      : null;
  const pAllow2 =
    input.s > 0
      ? calcStresscalcZoneAllowablePressure(
          input.s,
          cc23,
          toroidal.K2,
          shape.Y2,
          input.Da,
          input.sigma,
          input.phi
        )
      : null;
  const pAllow3 =
    input.s > 0
      ? calcStresscalcZoneAllowablePressure(
          input.s,
          cc23,
          toroidal.K3,
          shape.Y3,
          input.Da,
          input.sigma,
          input.phi
        )
      : null;

  if (input.s > 0 && (pAllow1 == null || pAllow2 == null || pAllow3 == null)) {
    return {
      ...base,
      sr,
      sr1,
      sr2,
      sr3,
      src1,
      src2,
      src3,
      srcMax,
      sMinWall,
      error: "Не удалось рассчитать допускаемое давление",
    };
  }

  const pAllow =
    input.s > 0 && pAllow1 != null && pAllow2 != null && pAllow3 != null
      ? Math.min(pAllow1, pAllow2, pAllow3)
      : 0;

  return {
    c11,
    c12,
    c21,
    cc1,
    cc23,
    sr,
    sr1,
    sr2,
    sr3,
    src1,
    src2,
    src3,
    srcMax,
    sMinWall,
    pAllow1: pAllow1 ?? 0,
    pAllow2: pAllow2 ?? 0,
    pAllow3: pAllow3 ?? 0,
    pAllow,
    thicknessOk: input.s <= 0 || input.s >= srcMax,
    strengthOk: input.s > 0 && pAllow > 0 ? input.p <= pAllow : false,
    error: null,
  };
}

export { TEMP_LIMITS as elbowTempLimits };
