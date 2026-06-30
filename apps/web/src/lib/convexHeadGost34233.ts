/** Расчёт эллиптического и полусферического днища при внутреннем избыточном давлении
 *
 * Эллиптическое (ГОСТ 34233.2-2017, п. 6.3.1):
 *   s_p = p·R / (2·φ·[σ] − 0,5·p),  R = D² / (4H)
 *
 * Полусферическое (ИН № 6 / ПНАЭ, m₁=4, m₂=m₃=1):
 *   s_R = p·D / (4·φ·[σ] − p),  R = D / 2,  H = D / 2
 */
import {
  calcSpFromPressure as calcHemisphericalSp,
} from "@/lib/hemisphericalHead";
import {
  type ShellAllowances,
  resolveShellAllowances,
} from "@/lib/shellCalcShared";

export type ConvexHeadKind = "elliptical" | "hemispherical";

export interface ConvexHeadInputs {
  kind: ConvexHeadKind;
  D: number;
  H: number;
  sigma: number;
  phiP: number;
  p: number;
  allowances: ShellAllowances;
}
export interface ConvexHeadResults {
  c3: number;
  cc: number;
  R: number;
  sp: number;
  ss: number;
  thinnessRatio: number;
  heightRatio: number;
  radiusRatio: number;
  applicabilityOk: boolean;
  applicabilityNote: string;
  error: string | null;
}

export function resolveCrownRadius(D: number, H: number): number | null {
  if (!(D > 0) || !(H > 0)) return null;
  return (D * D) / (4 * H);
}

/** Внутренний радиус кривизны полусферического днища в вершине */
export function resolveHemisphericalCrownRadius(D: number): number | null {
  if (!(D > 0)) return null;
  return D / 2;
}

export function calcSpFromInternalPressure(
  p: number,
  R: number,
  sigma: number,
  phiP: number
): number | null {
  const denom = 2 * phiP * sigma - 0.5 * p;
  if (!(denom > 0) || !(R > 0) || !(p >= 0) || !(phiP > 0) || !(sigma > 0)) return null;
  if (p === 0) return 0;
  return (p * R) / denom;
}
export function checkEllipticalApplicability(sEff: number, D: number, H: number) {
  const thinnessRatio = sEff / D;
  const heightRatio = H / D;
  const thinOk = thinnessRatio >= 0.002 && thinnessRatio <= 0.1;
  const heightOk = heightRatio >= 0.2 && heightRatio <= 0.5;
  const ok = thinOk && heightOk;
  const note = "0,002 ≤ (s − c)/D ≤ 0,100 и 0,2 ≤ H/D ≤ 0,5 — эллиптическое днище";
  return { thinnessRatio, heightRatio, thinOk, heightOk, ok, note };
}

export function checkHemisphericalApplicability(sEff: number, D: number) {
  const thinnessRatio = sEff / D;
  const ok = thinnessRatio >= 0.0025 && thinnessRatio <= 0.1;
  const note = "0,0025 ≤ (s − c)/D ≤ 0,100 — полусферическое днище";
  return { thinnessRatio, ok, note };
}

export function calculateConvexHeadInternal(input: ConvexHeadInputs): ConvexHeadResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const base = {
    c3,
    cc,
    R: 0,
    sp: 0,
    ss: 0,
    thinnessRatio: 0,
    heightRatio: 0,
    radiusRatio: 0,
    applicabilityOk: false,
    applicabilityNote: "",
    error: null as string | null,
  };

  const isHemispherical = input.kind === "hemispherical";
  const R = isHemispherical
    ? resolveHemisphericalCrownRadius(input.D)
    : resolveCrownRadius(input.D, input.H);
  if (R == null) {
    return { ...base, error: isHemispherical ? "Задайте D" : "Задайте D и H" };
  }

  const sp = isHemispherical
    ? calcHemisphericalSp(input.p, input.D, input.sigma, input.phiP)
    : calcSpFromInternalPressure(input.p, R, input.sigma, input.phiP);
  if (sp == null) {
    return {
      ...base,
      R,
      error: isHemispherical
        ? "Невозможно рассчитать s: проверьте p, σ, φ и знаменатель 4·φ·[σ] − p > 0"
        : "Невозможно рассчитать s: проверьте p, σ, φ и знаменатель 2·φ·[σ] − 0,5·p > 0",
    };
  }
  const ss = sp + cc;
  const sEff = ss - cc;

  if (input.kind === "elliptical") {
    const app = checkEllipticalApplicability(sEff, input.D, input.H);
    return {
      ...base,
      R,
      sp,
      ss,
      thinnessRatio: app.thinnessRatio,
      heightRatio: app.heightRatio,
      radiusRatio: 0,
      applicabilityOk: app.ok,
      applicabilityNote: app.note,
      error: null,
    };
  }

  const app = checkHemisphericalApplicability(sEff, input.D);
  return {
    ...base,
    R,
    sp,
    ss,
    thinnessRatio: app.thinnessRatio,
    heightRatio: input.H / input.D,
    radiusRatio: 0,
    applicabilityOk: app.ok,
    applicabilityNote: app.note,
    error: null,
  };
}
