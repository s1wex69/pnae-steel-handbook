/** Расчёт круглых плоских днищ и крышек (ПНАЭ / ИН № 9) */

import {
  type ShellAllowances,
  type ShellSolveTarget,
  resolveShellAllowances,
} from "@/lib/shellCalcShared";

export type FlatHeadConnectionType = 1 | 2 | 3 | 4 | 5;

export const FLAT_HEAD_K0: Record<FlatHeadConnectionType, number> = {
  1: 0.53,
  2: 0.44,
  3: 0.47,
  4: 0.6,
  5: 0.45,
};

/** Для типа 2 допускается K0 = 0,47 */
export const FLAT_HEAD_K0_ALT_TYPE2 = 0.47;

export interface FlatCircularHeadInputs {
  connectionType: FlatHeadConnectionType;
  k0: number;
  isCover: boolean;
  D: number;
  /** Радиус закругления r (тип 2) */
  r: number;
  /** D2 (тип 5) */
  D2: number;
  /** D4 (тип 4) */
  D4: number;
  sigmaHead: number;
  sigmaShell: number;
  sShell: number;
  s2: number;
  phiP: number;
  p: number;
  sp: number;
  allowances: ShellAllowances;
  solveFor: ShellSolveTarget;
}

export interface FlatCircularHeadResults {
  c3: number;
  cc: number;
  DR: number;
  x: number;
  K4: number;
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

export function calcFlatHeadDR(input: Pick<FlatCircularHeadInputs, "connectionType" | "D" | "r" | "D2" | "D4">) {
  switch (input.connectionType) {
    case 1:
    case 3:
      return input.D;
    case 2:
      return input.D - input.r;
    case 4:
      return input.D4;
    case 5:
      return input.D2;
    default:
      return input.D;
  }
}

export function calcStiffnessX(
  isCover: boolean,
  sigmaHead: number,
  sigmaShell: number,
  sShell: number,
  s2: number
): number {
  if (isCover) return 1;
  if (!(sigmaShell > 0) || !(s2 > 0) || !(sigmaHead > 0) || !(sShell > 0)) return 0.76;
  const ratio = (sigmaHead / sigmaShell) * (sShell / s2);
  const x = 0.5 + 0.25 * Math.cbrt(ratio);
  return Math.max(0.76, x);
}

export function calcK4(k0: number, x: number) {
  return k0 * x;
}

export function calcSpFromPressure(
  p: number,
  DR: number,
  sigma: number,
  phiP: number,
  K4: number
): number | null {
  if (!(DR > 0) || !(K4 > 0) || !(phiP > 0) || !(sigma > 0) || !(p >= 0)) return null;
  return DR * Math.sqrt((K4 * p) / (phiP * sigma));
}

export function calcPressureFromSp(
  sp: number,
  DR: number,
  sigma: number,
  phiP: number,
  K4: number
): number | null {
  if (!(DR > 0) || !(K4 > 0) || !(sp > 0) || !(phiP > 0) || !(sigma > 0)) return null;
  return (sp * sp * phiP * sigma) / (K4 * DR * DR);
}

export function calcAllowablePressure(
  ss: number,
  cc: number,
  DR: number,
  sigma: number,
  phiP: number,
  K4: number
): number | null {
  const sEff = ss - cc;
  if (!(sEff > 0)) return null;
  return calcPressureFromSp(sEff, DR, sigma, phiP, K4);
}

export function checkFlatHeadApplicability(sEff: number, DR: number) {
  const ratio = sEff / DR;
  const limit = 0.2;
  const note = "(s₁ − c) / D_R ≤ 0,2 — плоское круглое днище или крышка";
  return { ratio, limit, ok: ratio <= limit, note };
}

export function calcSsFromAllowablePressure(
  pp: number,
  cc: number,
  DR: number,
  sigma: number,
  phiP: number,
  K4: number
): number | null {
  const sp = calcSpFromPressure(pp, DR, sigma, phiP, K4);
  if (sp == null) return null;
  return sp + cc;
}

export function calculateFlatCircularHead(input: FlatCircularHeadInputs): FlatCircularHeadResults {
  const { c3, cc } = resolveShellAllowances(input.allowances);
  const DR = calcFlatHeadDR(input);
  const x = calcStiffnessX(input.isCover, input.sigmaHead, input.sigmaShell, input.sShell, input.s2);
  const K4 = calcK4(input.k0, x);

  const base = {
    c3,
    cc,
    DR,
    x,
    K4,
    sp: input.sp,
    ss: 0,
    p: input.p,
    pp: 0,
    thinnessRatio: 0,
    applicabilityOk: false,
    applicabilityLimit: 0.2,
    applicabilityNote: "",
    error: null as string | null,
  };

  if (!(DR > 0)) {
    return { ...base, error: "Расчётный диаметр D_R должен быть больше нуля" };
  }

  let sp = input.sp;
  let p = input.p;

  if (input.solveFor === "sp") {
    const next = calcSpFromPressure(p, DR, input.sigmaHead, input.phiP, K4);
    if (next == null) {
      return { ...base, error: "Невозможно рассчитать s_p: проверьте p, D_R, K₄, σ и φ" };
    }
    sp = next;
  } else {
    const next = calcPressureFromSp(sp, DR, input.sigmaHead, input.phiP, K4);
    if (next == null) {
      return { ...base, error: "Невозможно рассчитать p: проверьте s_p, D_R, K₄, σ и φ" };
    }
    p = next;
  }

  const ss = sp + cc;
  const sEff = ss - cc;
  const pp = calcAllowablePressure(ss, cc, DR, input.sigmaHead, input.phiP, K4);
  const { ratio, limit, ok, note } = checkFlatHeadApplicability(sEff, DR);

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
    DR,
    x,
    K4,
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
