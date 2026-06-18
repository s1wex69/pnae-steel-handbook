/** Расчёт цилиндрической обечайки при наружном избыточном давлении (ГОСТ 34233.1) */

export type ExternalShellSolveTarget = "sp" | "p";

export interface ExternalShellAllowances {
  c1: number;
  c2: number;
  c31: number;
  c32: number;
  c33: number;
  /** Заданная технологическая прибавка (иначе c31+c32+c33) */
  c3?: number;
  /** Заданная сумма прибавок (иначе c1+c2+c3) */
  cc?: number;
}

export interface ExternalShellInputs {
  D: number;
  sigma: number;
  /** Модуль продольной упругости, МПа */
  E: number;
  l1: number;
  ny: number;
  p: number;
  sp: number;
  allowances: ExternalShellAllowances;
  solveFor: ExternalShellSolveTarget;
}

export interface ExternalShellResults {
  c3: number;
  cc: number;
  sp: number;
  ss: number;
  p: number;
  pp: number;
  error: string | null;
}

function resolveAllowances(a: ExternalShellAllowances) {
  const c3 = a.c3 ?? a.c31 + a.c32 + a.c33;
  const cc = a.cc ?? a.c1 + a.c2 + c3;
  return { c3, cc };
}

export function calcCoefficientB(p: number, E: number, l1: number, D: number): number {
  const Bb = 0.47 * Math.pow(p / E, 0.067) * Math.pow(l1 / D, 0.4);
  return Math.max(1, Bb);
}

export function calcSp1(p: number, E: number, l1: number, D: number, B: number): number {
  return 1.06 * (D / B) * Math.pow((p / E) * (l1 / D), 0.4);
}

export function calcSp2(p: number, D: number, sigma: number): number | null {
  const denom = 2 * sigma - p;
  if (!(denom > 0)) return null;
  return (1.2 * p * D) / denom;
}

export function calcSpFromPressure(
  p: number,
  D: number,
  sigma: number,
  E: number,
  l1: number
): number | null {
  if (!(p > 0) || !(D > 0) || !(E > 0) || !(l1 > 0) || !(sigma > 0)) return null;
  const B = calcCoefficientB(p, E, l1, D);
  const sp1 = calcSp1(p, E, l1, D, B);
  const sp2 = calcSp2(p, D, sigma);
  if (sp2 == null) return null;
  return Math.max(sp1, sp2);
}

export function calcPn(sp: number, D: number, sigma: number): number | null {
  if (!(sp > 0)) return null;
  const denom = D + sp;
  if (!(denom > 0)) return null;
  return (2 * sigma * sp) / denom;
}

export function calcCoefficientB1(D: number, l1: number, sEff: number): number | null {
  if (!(D > 0) || !(l1 > 0) || !(sEff > 0)) return null;
  const B11 = 9.45 * (D / l1) * Math.sqrt(D / (100 * sEff));
  return Math.min(1, B11);
}

export function calcPe(
  E: number,
  ny: number,
  B1: number,
  D: number,
  l1: number,
  sEff: number
): number | null {
  if (!(E > 0) || !(ny > 0) || !(B1 > 0) || !(D > 0) || !(l1 > 0) || !(sEff > 0)) return null;
  return (
    2.08e-5 *
    (E / (ny * B1)) *
    (D / l1) *
    Math.pow((100 * sEff) / D, 2.5)
  );
}

export function calcAllowableExternalPressure(pn: number, pe: number): number | null {
  if (!(pn > 0) || !(pe > 0)) return null;
  return pn / Math.sqrt(1 + Math.pow(pn / pe, 2));
}

export function calcPpFromSp(
  sp: number,
  D: number,
  sigma: number,
  E: number,
  l1: number,
  ny: number
): number | null {
  const pn = calcPn(sp, D, sigma);
  if (pn == null) return null;
  const B1 = calcCoefficientB1(D, l1, sp);
  if (B1 == null) return null;
  const pe = calcPe(E, ny, B1, D, l1, sp);
  if (pe == null) return null;
  return calcAllowableExternalPressure(pn, pe);
}

export function calcPressureFromSp(
  sp: number,
  D: number,
  sigma: number,
  E: number,
  l1: number,
  tolerance = 1e-4
): number | null {
  if (!(sp > 0) || !(D > 0) || !(sigma > 0) || !(E > 0) || !(l1 > 0)) return null;

  const maxP = 2 * sigma - 1e-3;
  if (!(maxP > 0)) return null;

  let lo = 1e-6;
  let hi = maxP;

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const nextSp = calcSpFromPressure(mid, D, sigma, E, l1);
    if (nextSp == null) {
      hi = mid;
      continue;
    }
    if (Math.abs(nextSp - sp) <= tolerance) return mid;
    if (nextSp < sp) lo = mid;
    else hi = mid;
  }

  const p = (lo + hi) / 2;
  const check = calcSpFromPressure(p, D, sigma, E, l1);
  if (check == null || Math.abs(check - sp) > tolerance * 10) return null;
  return p;
}

export function calcSpFromAllowablePp(
  pp: number,
  D: number,
  sigma: number,
  E: number,
  l1: number,
  ny: number,
  tolerance = 1e-4
): number | null {
  if (!(pp > 0)) return null;

  let lo = 0.1;
  let hi = Math.max(D * 0.5, 1);

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const nextPp = calcPpFromSp(mid, D, sigma, E, l1, ny);
    if (nextPp == null) {
      lo = mid;
      continue;
    }
    if (Math.abs(nextPp - pp) <= tolerance) return mid;
    if (nextPp < pp) lo = mid;
    else hi = mid;
  }

  const sp = (lo + hi) / 2;
  const check = calcPpFromSp(sp, D, sigma, E, l1, ny);
  if (check == null || Math.abs(check - pp) > tolerance * 10) return null;
  return sp;
}

export function calculateCylindricalShellExternal(input: ExternalShellInputs): ExternalShellResults {
  const { c3, cc } = resolveAllowances(input.allowances);
  const base = {
    c3,
    cc,
    sp: input.sp,
    ss: 0,
    p: input.p,
    pp: 0,
    error: null as string | null,
  };

  let sp = input.sp;
  let p = input.p;

  if (input.solveFor === "sp") {
    const next = calcSpFromPressure(p, input.D, input.sigma, input.E, input.l1);
    if (next == null) {
      return {
        ...base,
        error:
          "Невозможно рассчитать s_p: проверьте p, D, σ, E, l₁ и условие 2·σ − p > 0",
      };
    }
    sp = next;
  } else {
    const next = calcPressureFromSp(sp, input.D, input.sigma, input.E, input.l1);
    if (next == null) {
      return {
        ...base,
        error: "Невозможно рассчитать p: проверьте s_p, D, σ, E и l₁",
      };
    }
    p = next;
  }

  const ss = sp + cc;
  const pp = calcPpFromSp(sp, input.D, input.sigma, input.E, input.l1, input.ny);
  if (pp == null) {
    return {
      ...base,
      sp,
      ss,
      p,
      error: "Не удалось рассчитать допускаемое наружное давление p_p",
    };
  }

  return { c3, cc, sp, ss, p, pp, error: null };
}
