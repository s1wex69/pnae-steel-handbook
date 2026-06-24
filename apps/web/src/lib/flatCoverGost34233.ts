/** Расчёт плоской круглой крышки с дополнительным краевым моментом (ГОСТ 34233.2-2017, §7.3)
 *
 * Qд = 0,785 · p · D²с.п
 * ψ₁ = P⁰б / Qд                                    — формула (80)
 * K₆ = K · [1 + 3ψ₁(D₃/Dс.п − 1)] / (D₃/Dс.п)   — формула (79)
 * s₁ₚ = K₀ · K₆ · Dₚ · √(p / [σ])               — формула (78)
 * [p] = ((s₁ − c) / (K₀ · K₆ · Dₚ))² · [σ]      — формула (84)
 * K₇ = 0,8 · (D₃/Dс.п − 1)                       — формула (83)
 * Φ = P⁰б / [σ]
 * s₂ ≥ max{K₇·√Φ; (0,6/Dс.п)·Φ} + c              — формула (82)
 */

import {
  type FlatHeadAttachmentType,
  type FlatHeadGeometry,
  resolveFlatHeadK,
} from "@/lib/flatHeadTable4Gost34233";
import { type ShellAllowances, resolveShellAllowances } from "@/lib/shellCalcShared";

export interface FlatCoverInputs {
  attachmentType: FlatHeadAttachmentType;
  D: number;
  D3: number;
  Dcp: number;
  /** Суммарное болтовое усилие P⁰б, Н */
  boltForce: number;
  /** Расчётный диаметр крышки Dₚ (если задан вручную) */
  dpOverride?: number;
  sShell: number;
  cShell: number;
  k0: number;
  sigma: number;
  p: number;
  s1: number;
  allowances: ShellAllowances;
  geometry: Omit<FlatHeadGeometry, "D" | "sShell" | "s1" | "cShell" | "cHead" | "D3" | "Dcp">;
}

export interface FlatCoverResults {
  c3: number;
  cc: number;
  K: number;
  K6: number;
  K7: number;
  Dp: number;
  Qd: number;
  psi1: number;
  phiParam: number;
  kNote: string;
  s1p: number;
  s1Min: number;
  s2Min: number;
  pAllow: number;
  thinnessRatio: number;
  applicabilityOk: boolean;
  error: string | null;
}

export function calcCoverQd(p: number, Dcp: number): number {
  return 0.785 * p * Dcp * Dcp;
}

export function calcCoverPsi1(boltForce: number, Qd: number): number | null {
  if (!(Qd > 0)) return null;
  return boltForce / Qd;
}

/** K₆ по формуле (79); для сварных типов без болтового усилия K₆ = K */
export function calcCoverK6(
  K: number,
  psi1: number,
  D3: number,
  Dcp: number,
  bolted: boolean
): number | null {
  if (!(K > 0)) return null;
  if (!bolted || !(D3 > 0) || !(Dcp > 0)) return K;
  const ratio = D3 / Dcp;
  if (!(ratio > 0)) return null;
  return (K * (1 + 3 * psi1 * (ratio - 1))) / ratio;
}

export function calcCoverK7(D3: number, Dcp: number): number | null {
  if (!(D3 > 0) || !(Dcp > 0)) return null;
  return 0.8 * (D3 / Dcp - 1);
}

export function calcCoverPhiParam(boltForce: number, sigma: number): number | null {
  if (!(sigma > 0)) return null;
  return boltForce / sigma;
}

export function calcFlatCoverS1p(
  k0: number,
  K6: number,
  Dp: number,
  p: number,
  sigma: number
): number | null {
  if (!(k0 > 0) || !(K6 > 0) || !(Dp > 0) || !(sigma > 0) || !(p >= 0)) return null;
  return k0 * K6 * Dp * Math.sqrt(p / sigma);
}

export function calcFlatCoverAllowablePressure(
  s1: number,
  cc: number,
  k0: number,
  K6: number,
  Dp: number,
  sigma: number
): number | null {
  const sEff = s1 - cc;
  if (!(sEff > 0) || !(k0 > 0) || !(K6 > 0) || !(Dp > 0)) return null;
  const denom = k0 * K6 * Dp;
  return ((sEff * sEff) / (denom * denom)) * sigma;
}

export function calcFlatCoverS2Min(
  K7: number,
  phiParam: number,
  Dcp: number,
  cc: number
): number | null {
  if (!(Dcp > 0) || !(phiParam >= 0) || K7 == null) return null;
  const sqrtPhi = Math.sqrt(Math.max(phiParam, 0));
  const term1 = K7 * sqrtPhi;
  const term2 = (0.6 / Dcp) * phiParam;
  return Math.max(term1, term2) + cc;
}

export function calculateFlatCover(input: FlatCoverInputs): FlatCoverResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const base = {
    c3,
    cc,
    K: 0,
    K6: 0,
    K7: 0,
    Dp: 0,
    Qd: 0,
    psi1: 0,
    phiParam: 0,
    kNote: "",
    s1p: 0,
    s1Min: 0,
    s2Min: 0,
    pAllow: 0,
    thinnessRatio: 0,
    applicabilityOk: false,
    error: null as string | null,
  };

  const bolted = input.attachmentType === 11 || input.attachmentType === 12;
  const D3 = input.D3 > 0 ? input.D3 : input.D;
  const Dcp = input.Dcp > 0 ? input.Dcp : input.D;

  const geom: FlatHeadGeometry = {
    D: input.D,
    sShell: input.sShell,
    s1: input.s1 > 0 ? input.s1 : input.sShell,
    cShell: input.cShell,
    cHead: cc,
    D3,
    Dcp,
    ...input.geometry,
  };

  const solveWithK6 = (K: number, Dp: number) => {
    const Qd = calcCoverQd(input.p, Dcp);
    const psi1 = bolted ? calcCoverPsi1(input.boltForce, Qd) ?? 0 : 0;
    const K6 = calcCoverK6(K, psi1, D3, Dcp, bolted) ?? K;
    return calcFlatCoverS1p(input.k0, K6, Dp, input.p, input.sigma);
  };

  const { K, Dp: DpTable, note } = resolveFlatHeadK(input.attachmentType, geom, solveWithK6);
  const Dp = input.dpOverride != null && input.dpOverride > 0 ? input.dpOverride : DpTable;

  const Qd = calcCoverQd(input.p, Dcp);
  const psi1 = bolted ? calcCoverPsi1(input.boltForce, Qd) ?? 0 : 0;
  const K6 = calcCoverK6(K, psi1, D3, Dcp, bolted);
  const K7 = bolted ? calcCoverK7(D3, Dcp) : 0;
  const phiParam = calcCoverPhiParam(input.boltForce, input.sigma) ?? 0;

  if (K6 == null) {
    return { ...base, K, Dp, kNote: note, error: "Не удалось рассчитать K₆" };
  }

  const s1p = calcFlatCoverS1p(input.k0, K6, Dp, input.p, input.sigma);
  if (s1p == null) {
    return { ...base, K, K6, Dp, Qd, psi1, phiParam, kNote: note, error: "Невозможно рассчитать s₁ₚ" };
  }

  const s1Min = s1p + cc;
  const s1Used = input.s1 > 0 ? input.s1 : s1Min;
  const pAllow = calcFlatCoverAllowablePressure(s1Used, cc, input.k0, K6, Dp, input.sigma);
  if (pAllow == null) {
    return {
      ...base,
      K,
      K6,
      K7: K7 ?? 0,
      Dp,
      Qd,
      psi1,
      phiParam,
      kNote: note,
      s1p,
      s1Min,
      error: "Не удалось рассчитать [p]",
    };
  }

  const s2Min = bolted ? calcFlatCoverS2Min(K7 ?? 0, phiParam, Dcp, cc) ?? 0 : 0;
  const sEff = s1Used - cc;
  const thinnessRatio = sEff / Dp;

  return {
    c3,
    cc,
    K,
    K6,
    K7: K7 ?? 0,
    Dp,
    Qd,
    psi1,
    phiParam,
    kNote: note,
    s1p,
    s1Min,
    s2Min,
    pAllow,
    thinnessRatio,
    applicabilityOk: thinnessRatio <= 0.11,
    error: null,
  };
}
