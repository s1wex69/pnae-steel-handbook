/** Расчёт цилиндрической обечайки при внутреннем избыточном давлении (ГОСТ 34233.2-2017, п. 5.3.1)
 *
 * s_p = p·D / (2·[σ]·φ_p − p)
 * s ≥ s_p + c,   c = c_1 + c_2 + c_3
 * [p] = 2·[σ]·φ_p·(s − c) / (D + s − c)
 * Применимость (п. 5.2.1): (s − c)/D ≤ 0,1 при D ≥ 200 мм; ≤ 0,3 при D < 200 мм
 */

import {
  type ShellAllowances,
  type ShellSolveTarget,
  resolveShellAllowances,
} from "@/lib/shellCalcShared";

export type { ShellAllowances, ShellSolveTarget };

export interface ShellInputs {
  D: number;
  sigma: number;
  phiP: number;
  p: number;
  sp: number;
  allowances: ShellAllowances;
  solveFor: ShellSolveTarget;
}

export interface ShellResults {
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
  D: number,
  sigma: number,
  phiP: number
): number | null {
  const denom = 2 * sigma * phiP - p;
  if (!(denom > 0)) return null;
  return (p * D) / denom;
}

export function calcPressureFromSp(
  sp: number,
  D: number,
  sigma: number,
  phiP: number
): number | null {
  const denom = D + sp;
  if (!(denom > 0) || !(sp > 0)) return null;
  return (2 * sigma * phiP * sp) / denom;
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
  const denom = D + sEff;
  if (!(denom > 0)) return null;
  return (2 * sigma * phiP * sEff) / denom;
}

/** Исполнительная толщина по допускаемому давлению p_p */
export function calcSsFromAllowablePressure(
  pp: number,
  cc: number,
  D: number,
  sigma: number,
  phiP: number
): number | null {
  const denom = 2 * sigma * phiP - pp;
  if (!(denom > 0)) return null;
  return cc + (pp * D) / denom;
}

export function checkApplicability(sEff: number, D: number): {
  ratio: number;
  limit: number;
  ok: boolean;
  note: string;
} {
  const ratio = sEff / D;
  const limit = D >= 200 ? 0.1 : 0.3;
  const note =
    D >= 200
      ? "(s − c) / D ≤ 0,1 — для обечаек и труб при D ≥ 200 мм"
      : "(s − c) / D ≤ 0,3 — для труб при D < 200 мм";
  return { ratio, limit, ok: ratio <= limit, note };
}

export function calculateCylindricalShellInternal(input: ShellInputs): ShellResults {
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
    applicabilityLimit: input.D >= 200 ? 0.1 : 0.3,
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
        error: "Невозможно рассчитать s_p: проверьте p, σ, φ_p и знаменатель 2·σ·φ_p − p > 0",
      };
    }
    sp = next;
  } else {
    const next = calcPressureFromSp(sp, input.D, input.sigma, input.phiP);
    if (next == null) {
      return {
        ...base,
        error: "Невозможно рассчитать p: проверьте s_p, D, σ и φ_p",
      };
    }
    p = next;
  }

  const ss = sp + cc;
  const sEff = ss - cc;
  const pp = calcAllowablePressure(ss, cc, input.D, input.sigma, input.phiP);
  const { ratio, limit, ok, note } = checkApplicability(sEff, input.D);

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
