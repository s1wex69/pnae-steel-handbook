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
import { resolveFlatHeadK0, type FlatHeadK0Result } from "@/lib/flatHeadK0Gost34233";
import { type ShellAllowances, resolveShellAllowances } from "@/lib/shellCalcShared";

export interface FlatBottomHoleConfig {
  count: 0 | 1 | 2 | 3;
  diameters: [number, number, number];
}

export interface FlatBottomInputs {
  attachmentType: FlatHeadAttachmentType;
  D: number;
  sShell: number;
  cShell: number;
  /** Ручной K₀ (если отверстий нет) */
  k0Manual?: number;
  holes?: FlatBottomHoleConfig;
  sigma: number;
  phiP: number;
  p: number;
  s1: number;
  /** Принятая s₂ в зоне уплотнения / канавки (типы 10–12) */
  s2?: number;
  allowances: ShellAllowances;
  geometry: Omit<FlatHeadGeometry, "D" | "sShell" | "s1" | "cShell" | "cHead">;
}

export interface FlatBottomResults {
  c3: number;
  cc: number;
  K: number;
  Dp: number;
  k0: number;
  k0Note: string;
  kNote: string;
  s1p: number;
  s1Min: number;
  s2Min: number;
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

/** s₂ по п. 7.2.8 для типов 10, 11, 12 */
export function calcFlatHeadS2Min(
  type: FlatHeadAttachmentType,
  input: {
    sShell: number;
    cShell: number;
    s1: number;
    cc: number;
    Dp: number;
    r?: number;
    gammaDeg?: number;
    D2?: number;
  }
): number | null {
  const s1Eff = input.s1 - input.cc;
  const sShellEff = input.sShell - input.cShell;
  if (!(s1Eff > 0)) return null;

  if (type === 10) {
    const r = input.r ?? 0;
    const gammaRad = ((input.gammaDeg ?? 45) * Math.PI) / 180;
    const denom = input.Dp - 2 * r;
    const termShell = 1.1 * sShellEff;
    const termGroove =
      denom > 0
        ? s1Eff / (1 + (1.2 * s1Eff * Math.sin(gammaRad)) / denom)
        : s1Eff;
    return Math.max(termShell, termGroove) + input.cc;
  }

  if (type === 11 || type === 12) {
    const D2 = input.D2 ?? 0;
    const denom = input.Dp - D2;
    const term1 = 0.7 * s1Eff;
    const term2 = denom > 0 ? (s1Eff * s1Eff) / denom : 0;
    return Math.max(term1, term2) + input.cc;
  }

  return null;
}

export function calculateFlatBottom(input: FlatBottomInputs): FlatBottomResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const base = {
    c3,
    cc,
    K: 0,
    Dp: 0,
    k0: 1,
    k0Note: "",
    kNote: "",
    s1p: 0,
    s1Min: 0,
    s2Min: 0,
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
    (k, dp) => {
      const k0Probe = resolveK0ForDp(input, dp);
      if (k0Probe.error) return null;
      return calcFlatBottomS1p(k, k0Probe.k0, dp, input.p, input.sigma, input.phiP);
    }
  );

  const k0Result = resolveK0ForDp(input, Dp);
  if (k0Result.error) {
    return { ...base, K, Dp, kNote: note, k0: k0Result.k0, k0Note: k0Result.note, error: k0Result.error };
  }

  const s1p = calcFlatBottomS1p(K, k0Result.k0, Dp, input.p, input.sigma, input.phiP);
  if (s1p == null) {
    return {
      ...base,
      K,
      Dp,
      k0: k0Result.k0,
      k0Note: k0Result.note,
      kNote: note,
      error: "Невозможно рассчитать s₁ₚ: проверьте исходные данные",
    };
  }

  const s1Min = s1p + cc;
  const s1Used = input.s1 > 0 ? input.s1 : s1Resolved ?? s1Min;
  const pAllow = calcFlatBottomAllowablePressure(
    s1Used,
    cc,
    K,
    k0Result.k0,
    Dp,
    input.sigma,
    input.phiP
  );
  if (pAllow == null) {
    return {
      ...base,
      K,
      Dp,
      k0: k0Result.k0,
      k0Note: k0Result.note,
      kNote: note,
      s1p,
      s1Min,
      error: "Не удалось рассчитать допускаемое давление [p]",
    };
  }

  const needsS2 = input.attachmentType === 10 || input.attachmentType === 11 || input.attachmentType === 12;
  const s2Min =
    needsS2
      ? calcFlatHeadS2Min(input.attachmentType, {
          sShell: input.sShell,
          cShell: input.cShell,
          s1: s1Used,
          cc,
          Dp,
          r: input.geometry.r,
          gammaDeg: input.geometry.gammaDeg,
          D2: input.geometry.D2,
        }) ?? 0
      : 0;

  const sEff = s1Used - cc;
  const thinnessRatio = sEff / Dp;
  const applicabilityOk = thinnessRatio <= 0.11;
  const shellThicknessOk = s1Used >= input.sShell;

  return {
    c3,
    cc,
    K,
    Dp,
    k0: k0Result.k0,
    k0Note: k0Result.note,
    kNote: note,
    s1p,
    s1Min,
    s2Min,
    pAllow,
    thinnessRatio,
    applicabilityOk,
    shellThicknessOk,
    error: null,
  };
}

function resolveK0ForDp(input: FlatBottomInputs, Dp: number): FlatHeadK0Result {
  const holes = input.holes;
  if (holes && holes.count > 0) {
    return resolveFlatHeadK0(holes.count, holes.diameters, Dp);
  }
  return resolveFlatHeadK0(0, [0, 0, 0], Dp, input.k0Manual);
}
