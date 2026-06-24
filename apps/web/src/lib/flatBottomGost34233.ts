/** Расчёт плоского круглого днища (ГОСТ 34233.2-2017, §7.2)
 *
 * s₁ₚ = K · K₀ · Dₚ · √(p / (φ · [σ]))          — формула (72)
 * s₁ ≥ s₁ₚ + c                                   — формула (71)
 * [p] = ((s₁ − c) / (K · K₀ · Dₚ))² · [σ] · φ   — формула (75)
 * (s₁ − c) / Dₚ ≤ 0,11                           — п. 7.1.1
 */

import {
  type FlatHeadAttachmentType,
  type FlatHeadGeometry,
  resolveFlatHeadK,
} from "@/lib/flatHeadTable4Gost34233";
import { type ShellAllowances, resolveShellAllowances } from "@/lib/shellCalcShared";

export interface FlatBottomInputs {
  attachmentType: FlatHeadAttachmentType;
  D: number;
  sShell: number;
  cShell: number;
  k0: number;
  sigma: number;
  phiP: number;
  p: number;
  s1: number;
  allowances: ShellAllowances;
  geometry: Omit<FlatHeadGeometry, "D" | "sShell" | "s1" | "cShell" | "cHead">;
}

export interface FlatBottomResults {
  c3: number;
  cc: number;
  K: number;
  Dp: number;
  kNote: string;
  s1p: number;
  s1Min: number;
  pAllow: number;
  thinnessRatio: number;
  applicabilityOk: boolean;
  shellThicknessOk: boolean;
  error: string | null;
}

export function calcFlatBottomS1p(
  K: number,
  k0: number,
  Dp: number,
  p: number,
  sigma: number,
  phiP: number
): number | null {
  if (!(K > 0) || !(k0 > 0) || !(Dp > 0) || !(sigma > 0) || !(phiP > 0) || !(p >= 0)) return null;
  return K * k0 * Dp * Math.sqrt(p / (phiP * sigma));
}

export function calcFlatBottomAllowablePressure(
  s1: number,
  cc: number,
  K: number,
  k0: number,
  Dp: number,
  sigma: number,
  phiP: number
): number | null {
  const sEff = s1 - cc;
  if (!(sEff > 0) || !(K > 0) || !(k0 > 0) || !(Dp > 0)) return null;
  const denom = K * k0 * Dp;
  return ((sEff * sEff) / (denom * denom)) * sigma * phiP;
}

export function calculateFlatBottom(input: FlatBottomInputs): FlatBottomResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const base = {
    c3,
    cc,
    K: 0,
    Dp: 0,
    kNote: "",
    s1p: 0,
    s1Min: 0,
    pAllow: 0,
    thinnessRatio: 0,
    applicabilityOk: false,
    shellThicknessOk: false,
    error: null as string | null,
  };

  if (!(input.D > 0)) return { ...base, error: "Диаметр D должен быть больше нуля" };
  if (!(input.p >= 0)) return { ...base, error: "Давление p не может быть отрицательным" };

  const geom: FlatHeadGeometry = {
    D: input.D,
    sShell: input.sShell,
    s1: input.s1 > 0 ? input.s1 : input.sShell,
    cShell: input.cShell,
    cHead: cc,
    ...input.geometry,
  };

  const { K, Dp, note, s1Resolved } = resolveFlatHeadK(
    input.attachmentType,
    geom,
    (k, dp) => calcFlatBottomS1p(k, input.k0, dp, input.p, input.sigma, input.phiP)
  );

  const s1p = calcFlatBottomS1p(K, input.k0, Dp, input.p, input.sigma, input.phiP);
  if (s1p == null) {
    return { ...base, K, Dp, kNote: note, error: "Невозможно рассчитать s₁ₚ: проверьте исходные данные" };
  }

  const s1Min = s1p + cc;
  const s1Used = input.s1 > 0 ? input.s1 : s1Resolved ?? s1Min;
  const pAllow = calcFlatBottomAllowablePressure(s1Used, cc, K, input.k0, Dp, input.sigma, input.phiP);
  if (pAllow == null) {
    return { ...base, K, Dp, kNote: note, s1p, s1Min, error: "Не удалось рассчитать допускаемое давление [p]" };
  }

  const sEff = s1Used - cc;
  const thinnessRatio = sEff / Dp;
  const applicabilityOk = thinnessRatio <= 0.11;
  const shellThicknessOk = s1Used >= input.sShell;

  return {
    c3,
    cc,
    K,
    Dp,
    kNote: note,
    s1p,
    s1Min,
    pAllow,
    thinnessRatio,
    applicabilityOk,
    shellThicknessOk,
    error: null,
  };
}
