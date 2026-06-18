/** Расчёт цилиндрического коллектора, штуцера, трубы (ПНАЭ / ИН № 7) */

import {
  type ShellAllowances,
  type ShellSolveTarget,
  resolveShellAllowances,
} from "@/lib/shellCalcShared";

export const PIPE_K = 1;

export interface PipeCollectorInputs {
  Da: number;
  sigma: number;
  phiP: number;
  p: number;
  sp: number;
  allowances: ShellAllowances;
  solveFor: ShellSolveTarget;
}

export interface PipeCollectorResults {
  c3: number;
  cc: number;
  sp: number;
  ss: number;
  p: number;
  pp: number;
  thinnessRatio: number;
  applicabilityOk: boolean;
  applicabilityLimit: number;
  applicabilityNote: string;
  error: string | null;
}

export function calcSpFromPressure(
  p: number,
  Da: number,
  sigma: number,
  phiP: number
): number | null {
  const denom = 2 * phiP * sigma + p;
  if (!(denom > 0)) return null;
  return (p * Da) / denom;
}

export function calcPressureFromSp(
  sp: number,
  Da: number,
  sigma: number,
  phiP: number,
  K = PIPE_K
): number | null {
  const denom = K * (Da - sp);
  if (!(denom > 0) || !(sp > 0)) return null;
  return (2 * sp * phiP * sigma) / denom;
}

export function calcAllowablePressure(
  ss: number,
  cc: number,
  Da: number,
  sigma: number,
  phiP: number,
  K = PIPE_K
): number | null {
  const sEff = ss - cc;
  if (!(sEff > 0)) return null;
  return calcPressureFromSp(sEff, Da, sigma, phiP, K);
}

export function calcSsFromAllowablePressure(
  pp: number,
  cc: number,
  Da: number,
  sigma: number,
  phiP: number
): number | null {
  const sp = calcSpFromPressure(pp, Da, sigma, phiP);
  if (sp == null) return null;
  return sp + cc;
}

export function checkPipeApplicability(sEff: number, Da: number) {
  const ratio = sEff / Da;
  const limit = 0.25;
  const note = "(s − c) / D_a ≤ 0,25 — коллектор, штуцер, труба";
  return { ratio, limit, ok: ratio <= limit, note };
}

export function calculatePipeCollector(input: PipeCollectorInputs): PipeCollectorResults {
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
    applicabilityLimit: 0.25,
    applicabilityNote: "",
    error: null as string | null,
  };

  let sp = input.sp;
  let p = input.p;

  if (input.solveFor === "sp") {
    const next = calcSpFromPressure(p, input.Da, input.sigma, input.phiP);
    if (next == null) {
      return {
        ...base,
        error: "Невозможно рассчитать s_p: проверьте p, D_a, σ и φ",
      };
    }
    sp = next;
  } else {
    const next = calcPressureFromSp(sp, input.Da, input.sigma, input.phiP);
    if (next == null) {
      return { ...base, error: "Невозможно рассчитать p: проверьте s_p, D_a, σ и φ" };
    }
    p = next;
  }

  const ss = sp + cc;
  const sEff = ss - cc;
  const pp = calcAllowablePressure(ss, cc, input.Da, input.sigma, input.phiP);
  const { ratio, limit, ok, note } = checkPipeApplicability(sEff, input.Da);

  if (pp == null) {
    return {
      ...base,
      sp,
      ss,
      p,
      thinnessRatio: ratio,
      applicabilityLimit: limit,
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
    applicabilityLimit: limit,
    applicabilityNote: note,
    error: null,
  };
}
