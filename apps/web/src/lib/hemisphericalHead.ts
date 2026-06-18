/** Расчёт полусферического днища (ПНАЭ / ИН № 6) */

import {
  type ShellAllowances,
  type ShellSolveTarget,
  resolveShellAllowances,
} from "@/lib/shellCalcShared";

export const HEMI_COEFFICIENTS = { m1: 4, m2: 1, m3: 1 } as const;

export interface HemisphericalHeadInputs {
  D: number;
  sigma: number;
  phiP: number;
  p: number;
  sp: number;
  allowances: ShellAllowances;
  solveFor: ShellSolveTarget;
}

export interface HemisphericalHeadResults {
  c3: number;
  cc: number;
  sp: number;
  ss: number;
  p: number;
  pp: number;
  thinnessRatio: number;
  applicabilityOk: boolean;
  applicabilityMin: number;
  applicabilityMax: number;
  applicabilityNote: string;
  error: string | null;
}

export function calcSpFromPressure(
  p: number,
  D: number,
  sigma: number,
  phiP: number
): number | null {
  const { m1, m2, m3 } = HEMI_COEFFICIENTS;
  const denom = m1 * phiP * sigma - p / m2;
  if (!(denom > 0)) return null;
  return (p * D * m3) / denom;
}

export function calcPressureFromSp(
  sp: number,
  D: number,
  sigma: number,
  phiP: number
): number | null {
  const { m1, m2, m3 } = HEMI_COEFFICIENTS;
  const denom = D * m3 + sp * m2;
  if (!(denom > 0) || !(sp > 0)) return null;
  return (sp * m1 * m2 * phiP * sigma) / denom;
}

export function calcAllowablePressure(
  ss: number,
  cc: number,
  D: number,
  sigma: number,
  phiP: number
): number | null {
  const sEff = ss - cc;
  if (!(sEff > 0)) return null;
  return calcPressureFromSp(sEff, D, sigma, phiP);
}

export function calcSsFromAllowablePressure(
  pp: number,
  cc: number,
  D: number,
  sigma: number,
  phiP: number
): number | null {
  const sp = calcSpFromPressure(pp, D, sigma, phiP);
  if (sp == null) return null;
  return sp + cc;
}

export function checkHemisphericalApplicability(sEff: number, D: number) {
  const ratio = sEff / D;
  const min = 0.0025;
  const max = 0.1;
  const note = "0,0025 ≤ (s − c) / D ≤ 0,1 — полусферическое днище";
  return { ratio, min, max, ok: ratio >= min && ratio <= max, note };
}

export function calculateHemisphericalHead(input: HemisphericalHeadInputs): HemisphericalHeadResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const base = {
    c3,
    cc,
    sp: input.sp,
    ss: 0,
    p: input.p,
    pp: 0,
    thinnessRatio: 0,
    applicabilityOk: false,
    applicabilityMin: 0.0025,
    applicabilityMax: 0.1,
    applicabilityNote: "",
    error: null as string | null,
  };

  let sp = input.sp;
  let p = input.p;

  if (input.solveFor === "sp") {
    const next = calcSpFromPressure(p, input.D, input.sigma, input.phiP);
    if (next == null) {
      return {
        ...base,
        error: "Невозможно рассчитать s_p: проверьте p, σ, φ и знаменатель m₁·φ·σ − p/m₂ > 0",
      };
    }
    sp = next;
  } else {
    const next = calcPressureFromSp(sp, input.D, input.sigma, input.phiP);
    if (next == null) {
      return { ...base, error: "Невозможно рассчитать p: проверьте s_p, D, σ и φ" };
    }
    p = next;
  }

  const ss = sp + cc;
  const sEff = ss - cc;
  const pp = calcAllowablePressure(ss, cc, input.D, input.sigma, input.phiP);
  const { ratio, min, max, ok, note } = checkHemisphericalApplicability(sEff, input.D);

  if (pp == null) {
    return {
      ...base,
      sp,
      ss,
      p,
      thinnessRatio: ratio,
      applicabilityNote: note,
      error: "Не удалось проверить допускаемое давление p_p",
    };
  }

  return {
    c3,
    cc,
    sp,
    ss,
    p,
    pp,
    thinnessRatio: ratio,
    applicabilityOk: ok,
    applicabilityMin: min,
    applicabilityMax: max,
    applicabilityNote: note,
    error: null,
  };
}
