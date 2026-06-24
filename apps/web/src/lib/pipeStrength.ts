/** Расчёт на прочность трубы (п. 4.2.2.1–4.2.2.2)
 *
 * sᵣ = p·Dₐ / (2·φ·[σ] + p)
 * s ≥ sᵣ + c,   c = c₁ + c₂ + c₃
 * (s − c) / Dₐ ≤ 0,25
 * [p]изг = 2·(s − c)·φ·[σ] / (Dₐ − (s − c))
 * [p]пр = 2·(s₁ − c₂)·φ·[σ] / (K·Dₐ − (s₁ − c₂)),  K = 1
 */

import { type ShellAllowances, resolveShellAllowances } from "@/lib/shellCalcShared";

export const PIPE_K = 1;
export const PIPE_APPLICABILITY_LIMIT = 0.25;

export interface PipeStrengthInputs {
  Da: number;
  sigma: number;
  phi: number;
  p: number;
  /** Принятая номинальная толщина s */
  s: number;
  allowances: ShellAllowances;
}

export interface PipeStrengthResults {
  c3: number;
  cc: number;
  c2: number;
  sr: number;
  sMin: number;
  pAllowMfg: number;
  pAllowDesign: number;
  thinnessRatio: number;
  applicabilityOk: boolean;
  thicknessOk: boolean;
  strengthOk: boolean;
  error: string | null;
}

export function calcPipeSr(p: number, Da: number, sigma: number, phi: number): number | null {
  const denom = 2 * phi * sigma + p;
  if (!(Da > 0) || !(denom > 0) || !(p >= 0)) return null;
  return (p * Da) / denom;
}

export function calcPipeAllowableMfg(
  s: number,
  c: number,
  Da: number,
  sigma: number,
  phi: number
): number | null {
  const sEff = s - c;
  const denom = Da - sEff;
  if (!(sEff > 0) || !(denom > 0)) return null;
  return (2 * sEff * phi * sigma) / denom;
}

export function calcPipeAllowableDesign(
  s1: number,
  c2: number,
  Da: number,
  sigma: number,
  phi: number,
  K = PIPE_K
): number | null {
  const sEff = s1 - c2;
  const denom = K * Da - sEff;
  if (!(sEff > 0) || !(denom > 0)) return null;
  return (2 * sEff * phi * sigma) / denom;
}

export function checkPipeApplicability(sEff: number, Da: number) {
  const ratio = Da > 0 ? sEff / Da : 0;
  return {
    ratio,
    limit: PIPE_APPLICABILITY_LIMIT,
    ok: ratio <= PIPE_APPLICABILITY_LIMIT,
  };
}

export function calculatePipeStrength(input: PipeStrengthInputs): PipeStrengthResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const c2 = input.allowances.c2;
  const base = {
    c3,
    cc,
    c2,
    sr: 0,
    sMin: 0,
    pAllowMfg: 0,
    pAllowDesign: 0,
    thinnessRatio: 0,
    applicabilityOk: false,
    thicknessOk: false,
    strengthOk: false,
    error: null as string | null,
  };

  const sr = calcPipeSr(input.p, input.Da, input.sigma, input.phi);
  if (sr == null) {
    return { ...base, error: "Невозможно рассчитать sᵣ: проверьте p, Dₐ, σ и φ" };
  }

  const sMin = sr + cc;
  const sUsed = input.s > 0 ? input.s : sMin;
  const sEff = sUsed - cc;
  const { ratio, ok: applicabilityOk } = checkPipeApplicability(sEff, input.Da);

  const pAllowMfg = calcPipeAllowableMfg(sUsed, cc, input.Da, input.sigma, input.phi);
  if (pAllowMfg == null) {
    return {
      ...base,
      sr,
      sMin,
      thinnessRatio: ratio,
      applicabilityOk,
      error: "Не удалось рассчитать допускаемое давление после изготовления",
    };
  }

  const pAllowDesign = calcPipeAllowableDesign(sUsed, c2, input.Da, input.sigma, input.phi, PIPE_K);
  if (pAllowDesign == null) {
    return {
      ...base,
      sr,
      sMin,
      pAllowMfg,
      thinnessRatio: ratio,
      applicabilityOk,
      error: "Не удалось рассчитать допускаемое давление при проектировании",
    };
  }

  return {
    c3,
    cc,
    c2,
    sr,
    sMin,
    pAllowMfg,
    pAllowDesign,
    thinnessRatio: ratio,
    applicabilityOk,
    thicknessOk: input.s <= 0 || input.s >= sMin,
    strengthOk: input.p <= pAllowMfg,
    error: null,
  };
}
