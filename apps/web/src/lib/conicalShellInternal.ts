/** Расчёт конической обечайки при внутреннем избыточном давлении (ГОСТ 34233.2-2017, §8.3.1)
 *
 * α — половина угла раствора при вершине (угол между осью и образующей).
 *
 * s_p = p·D / (2·[σ]·φ − p) · (1 / cosα)
 * s ≥ s_p + c
 * [p] = 2·[σ]·φ·(s − c)·cosα / (D + (s − c)·cosα)
 *
 * Условия применимости:
 * 0,005 ≤ (s − c)/D ≤ 0,1; α ≤ 45°;
 * D₀/D ≤ 1 − 2·√((1 + (s−c)/D)·(s−c)/D)·sinα/√cosα
 */

import {
  type ShellAllowances,
  type ShellSolveTarget,
  resolveShellAllowances,
} from "@/lib/shellCalcShared";

export type { ShellAllowances, ShellSolveTarget };

export const CONICAL_THINNESS_MIN = 0.005;
export const CONICAL_THINNESS_MAX = 0.1;
export const CONICAL_ALPHA_MAX = 45;

export interface ConicalShellInputs {
  D: number;
  D0: number;
  alphaDeg: number;
  sigma: number;
  phiP: number;
  p: number;
  sp: number;
  allowances: ShellAllowances;
  solveFor: ShellSolveTarget;
}

export interface ConicalShellResults {
  c3: number;
  cc: number;
  sp: number;
  ss: number;
  p: number;
  pp: number;
  cosAlpha: number;
  thinnessRatio: number;
  applicabilityOk: boolean;
  thinnessOk: boolean;
  alphaOk: boolean;
  d0Ratio: number;
  d0Limit: number;
  d0Ok: boolean;
  error: string | null;
}

/** cos α; α — полуугол при вершине (между осью конуса и образующей), град. */
export function cosAlphaFromDeg(alphaHalfDeg: number): number {
  return Math.cos((alphaHalfDeg * Math.PI) / 180);
}

export function calcConicalSpFromPressure(
  p: number,
  D: number,
  sigma: number,
  phiP: number,
  alphaDeg: number
): number | null {
  const denom = 2 * sigma * phiP - p;
  if (!(D > 0) || !(denom > 0) || !(p >= 0) || !(sigma > 0) || !(phiP > 0)) return null;
  const cosA = cosAlphaFromDeg(alphaDeg);
  if (!(cosA > 0)) return null;
  return (p * D) / denom / cosA;
}

export function calcConicalPressureFromSp(
  sp: number,
  D: number,
  sigma: number,
  phiP: number,
  alphaDeg: number
): number | null {
  const cosA = cosAlphaFromDeg(alphaDeg);
  if (!(cosA > 0) || !(sp > 0) || !(sigma > 0) || !(phiP > 0)) return null;
  const denom = D + sp * cosA;
  if (!(denom > 0)) return null;
  return (2 * sigma * phiP * sp * cosA) / denom;
}

export function calcConicalAllowablePressure(
  ss: number,
  cc: number,
  D: number,
  sigma: number,
  phiP: number,
  alphaDeg: number
): number | null {
  const sEff = ss - cc;
  if (!(sEff > 0) || !(sigma > 0) || !(phiP > 0)) return null;
  const cosA = cosAlphaFromDeg(alphaDeg);
  if (!(cosA > 0)) return null;
  const denom = D + sEff * cosA;
  if (!(denom > 0)) return null;
  return (2 * sigma * phiP * sEff * cosA) / denom;
}

/** Правая часть неравенства D₀/D ≤ 1 − 2·√((1 + (s−c)/D)·(s−c)/D)·sinα/√cosα */
export function calcConicalD0RatioLimit(
  sEff: number,
  D: number,
  alphaDeg: number
): number | null {
  if (!(D > 0) || !(sEff > 0)) return null;
  const ratio = sEff / D;
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const sinA = Math.sin(alphaRad);
  const cosA = Math.cos(alphaRad);
  if (!(cosA > 0)) return null;
  const sqrtTerm = Math.sqrt((1 + ratio) * ratio);
  return 1 - 2 * sqrtTerm * (sinA / Math.sqrt(cosA));
}

export function checkConicalApplicability(
  sEff: number,
  D: number,
  D0: number,
  alphaDeg: number
) {
  const thinnessRatio = D > 0 ? sEff / D : 0;
  const thinnessOk =
    thinnessRatio >= CONICAL_THINNESS_MIN && thinnessRatio <= CONICAL_THINNESS_MAX;
  const alphaOk = alphaDeg <= CONICAL_ALPHA_MAX;
  const d0Ratio = D > 0 && D0 > 0 ? D0 / D : 0;
  const d0Limit = calcConicalD0RatioLimit(sEff, D, alphaDeg);
  const d0Ok = d0Limit != null && D0 > 0 && d0Ratio <= d0Limit;
  return {
    thinnessRatio,
    thinnessOk,
    alphaOk,
    d0Ratio,
    d0Limit: d0Limit ?? 0,
    d0Ok,
    ok: thinnessOk && alphaOk && d0Ok,
  };
}

export function calculateConicalShellInternal(input: ConicalShellInputs): ConicalShellResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const cosAlpha = cosAlphaFromDeg(input.alphaDeg);
  const base = {
    c3,
    cc,
    sp: input.sp,
    ss: 0,
    p: input.p,
    pp: 0,
    cosAlpha,
    thinnessRatio: 0,
    applicabilityOk: false,
    thinnessOk: false,
    alphaOk: input.alphaDeg <= CONICAL_ALPHA_MAX,
    d0Ratio: 0,
    d0Limit: 0,
    d0Ok: false,
    error: null as string | null,
  };

  if (!(input.D > 0)) {
    return { ...base, error: "Задайте внутренний диаметр большего основания D" };
  }
  if (!(input.D0 > 0)) {
    return { ...base, error: "Задайте внутренний диаметр меньшего основания D₀" };
  }
  if (!(input.alphaDeg > 0) || !(cosAlpha > 0)) {
    return { ...base, error: "Задайте полуугол при вершине α" };
  }

  let sp = input.sp;
  let p = input.p;

  if (input.solveFor === "sp") {
    const next = calcConicalSpFromPressure(p, input.D, input.sigma, input.phiP, input.alphaDeg);
    if (next == null) {
      return {
        ...base,
        error: "Невозможно рассчитать s_p: проверьте p, σ, φ и знаменатель 2·[σ]·φ − p > 0",
      };
    }
    sp = next;
  } else {
    const next = calcConicalPressureFromSp(sp, input.D, input.sigma, input.phiP, input.alphaDeg);
    if (next == null) {
      return { ...base, error: "Невозможно рассчитать p: проверьте s_p, D, σ, φ и α" };
    }
    p = next;
  }

  const ss = sp + cc;
  const sEff = ss - cc;
  const pp = calcConicalAllowablePressure(ss, cc, input.D, input.sigma, input.phiP, input.alphaDeg);
  const app = checkConicalApplicability(sEff, input.D, input.D0, input.alphaDeg);

  if (pp == null) {
    return {
      ...base,
      sp,
      ss,
      p,
      thinnessRatio: app.thinnessRatio,
      thinnessOk: app.thinnessOk,
      alphaOk: app.alphaOk,
      d0Ratio: app.d0Ratio,
      d0Limit: app.d0Limit,
      d0Ok: false,
      error: "Не удалось рассчитать допускаемое давление [p]",
    };
  }

  return {
    c3,
    cc,
    sp,
    ss,
    p,
    pp,
    cosAlpha,
    thinnessRatio: app.thinnessRatio,
    applicabilityOk: app.ok,
    thinnessOk: app.thinnessOk,
    alphaOk: app.alphaOk,
    d0Ratio: app.d0Ratio,
    d0Limit: app.d0Limit,
    d0Ok: app.d0Ok,
    error: null,
  };
}
