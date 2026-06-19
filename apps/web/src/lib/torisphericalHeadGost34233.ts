/** Расчёт торосферического днища (ГОСТ 34233.2-2017, п. 6.4.2; ИН № 5)
 *
 * s_p = p·D·(D/(2H)) / (4·φ·[σ] − p)
 * s = s_p + c
 * p ≤ [p] по формуле (57): [p] = 4·[σ]·(s − c) / (D + s − c)
 */
import {
  type ShellAllowances,
  resolveShellAllowances,
} from "@/lib/shellCalcShared";

const M1 = 4;

export function calcSpTorisphericalExternal(
  p: number,
  D: number,
  H: number,
  sigma: number,
  phi: number
): number | null {
  if (!(denomOk(phi, sigma, p)) || !(D > 0) || !(H > 0) || !(p > 0) || !(phi > 0)) return null;
  return (p * D * (D / (2 * H))) / (4 * phi * sigma - p);
}

function denomOk(phi: number, sigma: number, p: number) {
  return 4 * phi * sigma - p > 0;
}
export function calcAllowableExternalPressureStrength(
  ss: number,
  cc: number,
  D: number,
  H: number,
  sigma: number,
  phi = 1
): number | null {
  const sEff = ss - cc;
  const m3 = D / (2 * H);
  if (!(sEff > 0) || !(D > 0) || !(H > 0) || !(phi > 0)) return null;
  const denom = D * m3 + sEff;
  if (!(denom > 0)) return null;
  return (M1 * phi * sigma * sEff) / denom;
}

export interface TorisphericalHeadInputs {
  D: number;
  H: number;
  sigma: number;
  phi: number;
  p: number;
  allowances: ShellAllowances;
}
export interface TorisphericalHeadResults {
  c3: number;
  cc: number;
  D1: number;
  sp: number;
  ss: number;
  pp: number;
  pp57: number;
  thinnessRatio: number;
  heightRatio: number;
  thinOk: boolean;
  heightOk: boolean;
  pressureOk57: boolean;
  applicabilityOk: boolean;
  applicabilityNote: string;
  error: string | null;
}

export function defaultTorisphericalGeometry(D: number) {
  return {
    H: 0.25 * D,
  };
}

export function calcAllowablePressureEdge57(
  ss: number,
  cc: number,
  D1: number,
  sigma: number
): number | null {
  const sEff = ss - cc;
  if (!(sEff > 0)) return null;
  const denom = D1 + sEff;
  if (!(denom > 0)) return null;
  return (4 * sigma * sEff) / denom;
}

export function checkTorisphericalApplicability(sEff: number, D: number, H: number) {
  const thinnessRatio = sEff / D;
  const heightRatio = H / D;
  const thinOk = thinnessRatio >= 0.0025 && thinnessRatio <= 0.1;
  const heightOk = heightRatio >= 0.2 && heightRatio <= 0.5;
  const ok = thinOk && heightOk;
  const note =
    "0,0025 ≤ (s − c)/D ≤ 0,100 и 0,2 ≤ H/D ≤ 0,5 — торосферическое днище";
  return { thinnessRatio, heightRatio, thinOk, heightOk, ok, note };
}

export function calculateTorisphericalHeadExternal(input: TorisphericalHeadInputs): TorisphericalHeadResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const D1 = input.D;

  const base = {
    c3,
    cc,
    D1,
    sp: 0,
    ss: 0,
    pp: 0,
    pp57: 0,
    thinnessRatio: 0,
    heightRatio: input.D > 0 ? input.H / input.D : 0,
    thinOk: false,
    heightOk: false,
    pressureOk57: false,
    applicabilityOk: false,
    applicabilityNote: "",
    error: null as string | null,
  };

  if (!(input.D > 0) || !(input.H > 0)) {
    return { ...base, error: "Задайте D и H" };
  }

  const sp = calcSpTorisphericalExternal(input.p, input.D, input.H, input.sigma, input.phi);
  if (sp == null) {
    return {
      ...base,
      error: "Невозможно рассчитать s: проверьте p, σ, φ и знаменатель 4·φ·[σ] − p > 0",
    };
  }

  const ss = sp + cc;
  const sEff = ss - cc;

  const pp = calcAllowableExternalPressureStrength(ss, cc, input.D, input.H, input.sigma, input.phi);
  const pp57 = calcAllowablePressureEdge57(ss, cc, D1, input.sigma);
  if (pp57 == null) {
    return { ...base, sp, ss, error: "Не удалось проверить допустимое внутреннее давление по формуле (57)" };
  }

  const pressureOk57 = input.p <= pp57 + 1e-9;
  const app = checkTorisphericalApplicability(sEff, input.D, input.H);
  return {
    ...base,
    sp,
    ss,
    pp: pp ?? 0,
    pp57,
    thinnessRatio: app.thinnessRatio,
    heightRatio: app.heightRatio,
    thinOk: app.thinOk,
    heightOk: app.heightOk,
    pressureOk57,
    applicabilityOk: app.ok && pressureOk57,
    applicabilityNote: app.note,
    error: null,
  };
}

/** @deprecated используйте calculateTorisphericalHeadExternal */
export const calculateTorisphericalHeadInternal = calculateTorisphericalHeadExternal;
