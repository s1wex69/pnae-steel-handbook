/** Общие типы и прибавки для расчётов оболочек и днищ */

export type ShellSolveTarget = "sp" | "p";

export interface ShellAllowances {
  c1: number;
  c2: number;
  c31: number;
  c32: number;
  c33: number;
  c3?: number;
  cc?: number;
}

export function resolveShellAllowances(a: ShellAllowances) {
  const c3 = a.c3 ?? a.c31 + a.c32 + a.c33;
  const cc = a.cc ?? a.c1 + a.c2 + c3;
  return { c3, cc };
}
