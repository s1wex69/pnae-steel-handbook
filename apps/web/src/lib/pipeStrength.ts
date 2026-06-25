/** Расчёт на прочность трубы — логика stresscalc.ru/boiler/boiler.php (ПНАЭ п. 4.2.2.1–4.2.2.2)
 *
 * sᵣ = p·Dₐ / (2·φ·[σ] + p)
 * s ≥ sᵣ + c,   c = c₁ + c₂  (минусовой допуск + коррозия)
 * [p] = 2·(s − c)·φ·[σ] / (Dₐ − (s − c))
 */

import { round2 } from "@/lib/stresscalcShell";

export interface PipeStrengthInputs {
  Da: number;
  sigma: number;
  phi: number;
  p: number;
  /** Принятая номинальная толщина s */
  s: number;
  /** c₂ — минусовой допуск (c₁₁ stresscalc), c₁ — коррозия (c₂₁ stresscalc) */
  cMinus: number;
  cCorrosion: number;
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
  if (!(Da > 0) || !(denom > 0) || !(p >= 0)) return null;
  return round2((p * Da) / denom);
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
  if (!(sEff > 0) || !(denom > 0)) return null;
  return round2((2 * sEff * phi * sigma) / denom);
}

export function calculatePipeStrength(input: PipeStrengthInputs): PipeStrengthResults {
  const cc = round2(input.cMinus + input.cCorrosion);
  const base = {
    cMinus: input.cMinus,
    cCorrosion: input.cCorrosion,
    cc,
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
    return { ...base, error: "Невозможно рассчитать sᵣ: проверьте p, Dₐ, σ и φ" };
  }

  const sMin = round2(sr + cc);
  const sUsed = input.s > 0 ? input.s : sMin;
  const innerD = input.s > 0 ? round2(input.Da - 2 * input.s) : 0;

  const pAllow = input.s > 0 ? calcPipeAllowablePressure(sUsed, cc, input.Da, input.sigma, input.phi) : null;
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
    cMinus: input.cMinus,
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
