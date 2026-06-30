/** Расчёт на прочность трубы
 *
 * sᵣ = p·Dₐ / (2·φ·[σ] + p)
 * s = sᵣ + c₁₁ + c₂₁,   c = c₁₁ + c₂₁
 * [p] = 2·φ·[σ]·(s − c) / (Dₐ − (s − c))
 * 0 ≤ (s − c) / Dₐ ≤ 0,25 — ПНАЭ п. 4.2.2.1
 */

import { round2, stresscalcMinusTolerance } from "@/lib/stresscalcShell";

export const PIPE_APPLICABILITY_MIN = 0;
export const PIPE_APPLICABILITY_MAX = 0.25;
export const PIPE_THINNESS_MIN = 0.0025;
export const PIPE_THINNESS_MAX = 0.1;

export interface PipeStrengthInputs {
  Da: number;
  sigma: number;
  phi: number;
  p: number;
  /** Принятая номинальная толщина s (для проверки [p]) */
  s: number;
  /** c₂ — минусовой допуск (c₁₁ stresscalc), c₁ — коррозия (c₂₁ stresscalc) */
  cMinus: number;
  cCorrosion: number;
  /** Если false — c₁₁ пересчитывается по ТУ 14-3Р-55 от толщины s */
  cMinusManual?: boolean;
}

export interface PipeStrengthResults {
  cMinus: number;
  cCorrosion: number;
  cc: number;
  sr: number;
  sMin: number;
  innerD: number;
  pAllow: number;
  thicknessOk: boolean;
  strengthOk: boolean;
  error: string | null;
}

export function calcPipeSr(p: number, Da: number, sigma: number, phi: number): number | null {
  const denom = 2 * phi * sigma + p;
  if (!(Da > 0) || !(denom > 0) || !(p >= 0) || !(sigma > 0) || !(phi > 0)) return null;
  return round2((p * Da) / denom);
}

/** c₁₁ = 10 % s (Da ≤ 114) или 5 % s — итерация по принятой толщине */
export function resolvePipeThickness(
  sr: number,
  Da: number,
  c21: number,
  options?: { c11Override?: number }
): { c11: number; s: number } {
  if (options?.c11Override != null && options.c11Override >= 0) {
    return { c11: round2(options.c11Override), s: round2(sr + options.c11Override + c21) };
  }

  let s = sr + c21;
  let c11 = stresscalcMinusTolerance(Da, s);
  for (let i = 0; i < 20; i++) {
    const sNext = round2(sr + c11 + c21);
    const c11Next = stresscalcMinusTolerance(Da, sNext);
    if (Math.abs(sNext - s) < 0.005 && Math.abs(c11Next - c11) < 0.005) {
      return { c11: round2(c11Next), s: sNext };
    }
    s = sNext;
    c11 = c11Next;
  }
  return { c11: round2(c11), s: round2(sr + c11 + c21) };
}

export function checkPipeApplicability(sEff: number, Da: number) {
  const ratio = Da > 0 ? sEff / Da : 0;
  const min = PIPE_APPLICABILITY_MIN;
  const max = PIPE_APPLICABILITY_MAX;
  return {
    ratio,
    min,
    max,
    ok: ratio >= min && ratio <= max,
    note: "0 ≤ (s − c) / Dₐ ≤ 0,25 — труба, штуцер, коллектор (ПНАЭ п. 4.2.2.1)",
  };
}

/** 0,0025 ≤ (s − c) / D ≤ 0,1 — тонкостенность (табл. 4.2 ПНАЭ, D — внутренний диаметр). */
export function checkPipeThinnessApplicability(sEff: number, innerD: number) {
  const ratio = innerD > 0 ? sEff / innerD : 0;
  const min = PIPE_THINNESS_MIN;
  const max = PIPE_THINNESS_MAX;
  return {
    ratio,
    min,
    max,
    ok: ratio >= min && ratio <= max,
    note: "0,0025 ≤ (s − c) / D ≤ 0,1",
  };
}

export function calcPipeAllowablePressure(
  s: number,
  cc: number,
  Da: number,
  sigma: number,
  phi: number
): number | null {
  const sEff = s - cc;
  const denom = Da - sEff;
  if (!(sEff > 0) || !(denom > 0) || !(sigma > 0) || !(phi > 0)) return null;
  return round2((2 * phi * sigma * sEff) / denom);
}

export function calculatePipeStrength(input: PipeStrengthInputs): PipeStrengthResults {
  const base = {
    cMinus: input.cMinus,
    cCorrosion: input.cCorrosion,
    cc: round2(input.cMinus + input.cCorrosion),
    sr: 0,
    sMin: 0,
    innerD: 0,
    pAllow: 0,
    thicknessOk: false,
    strengthOk: false,
    error: null as string | null,
  };

  const sr = calcPipeSr(input.p, input.Da, input.sigma, input.phi);
  if (sr == null) {
    return { ...base, error: "Невозможно рассчитать sᵣ: проверьте p, Dₐ, φ и [σ]" };
  }

  const { c11, s: sMin } = resolvePipeThickness(sr, input.Da, input.cCorrosion, {
    c11Override: input.cMinusManual ? input.cMinus : undefined,
  });
  const cc = round2(c11 + input.cCorrosion);
  const sUsed = input.s > 0 ? input.s : sMin;
  const innerD = input.s > 0 ? round2(input.Da - 2 * input.s) : 0;

  const pAllow =
    input.s > 0 ? calcPipeAllowablePressure(sUsed, cc, input.Da, input.sigma, input.phi) : null;
  if (input.s > 0 && pAllow == null) {
    return {
      ...base,
      sr,
      sMin,
      innerD,
      error: "Не удалось рассчитать допускаемое давление",
    };
  }

  return {
    cMinus: c11,
    cCorrosion: input.cCorrosion,
    cc,
    sr,
    sMin,
    innerD,
    pAllow: pAllow ?? 0,
    thicknessOk: input.s <= 0 || input.s >= sMin,
    strengthOk: input.s > 0 && pAllow != null ? input.p <= pAllow : false,
    error: null,
  };
}
