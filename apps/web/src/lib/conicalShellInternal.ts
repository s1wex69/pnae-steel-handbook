/** Расчёт конической обечайки при внутреннем избыточном давлении (ГОСТ 34233.2-2017, §8.3.1)
 *
 * α₁ — половина угла раствора при вершине (угол между осью и образующей).
 *
 * s_p = p·D / (2·[σ]·φ − p) · (1 / cosα₁)
 * s ≥ s_p + c
 * [p] = 2·[σ]·φ·(s − c)·cosα₁ / (D + (s − c)·cosα₁)
 * Применимость: (s − c)/D ≤ 0,1; α₁ ≤ 70°; p ≤ [p]
 */

import {
  type ShellAllowances,
  type ShellSolveTarget,
  resolveShellAllowances,
} from "@/lib/shellCalcShared";

export type { ShellAllowances, ShellSolveTarget };

export interface ConicalShellInputs {
  D: number;
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
  pressureOk: boolean;
  error: string | null;
}

/** cos α₁; α₁ — полуугол при вершине (между осью конуса и образующей), град. */
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

export function checkConicalApplicability(
  sEff: number,
  D: number,
  alphaDeg: number,
  p: number,
  pp: number
) {
  const thinnessRatio = D > 0 ? sEff / D : 0;
  const thinnessOk = thinnessRatio <= 0.1;
  const alphaOk = alphaDeg <= 70;
  const pressureOk = pp > 0 && p <= pp;
  return {
    thinnessRatio,
    thinnessOk,
    alphaOk,
    pressureOk,
    ok: thinnessOk && alphaOk && pressureOk,
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
    alphaOk: input.alphaDeg <= 70,
    pressureOk: false,
    error: null as string | null,
  };

  if (!(input.D > 0)) {
    return { ...base, error: "Задайте внутренний диаметр большего основания D" };
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
  const app = checkConicalApplicability(sEff, input.D, input.alphaDeg, p, pp ?? 0);

  if (pp == null) {
    return {
      ...base,
      sp,
      ss,
      p,
      thinnessRatio: app.thinnessRatio,
      thinnessOk: app.thinnessOk,
      alphaOk: app.alphaOk,
      pressureOk: false,
      error: "Не удалось проверить допускаемое давление [p]",
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
    pressureOk: app.pressureOk,
    error: null,
  };
}
