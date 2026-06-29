/** Коэффициент ослабления K₀ — ГОСТ 34233.2-2017, п. 7.2.3–7.2.5 */

const MAX_CHORD_RATIO = 0.7;

export interface FlatHeadHoleInput {
  /** Диаметр отверстия (хорда при расположении на диаметрали), мм */
  diameter: number;
}

export interface FlatHeadK0Result {
  k0: number;
  chordSum: number;
  note: string;
  error: string | null;
}

function fmtChord(v: number) {
  return Number(v.toFixed(2)).toString().replace(".", ",");
}

function sqrtK0(Dp: number, chordSum: number, single: boolean): FlatHeadK0Result | null {
  if (!(Dp > 0)) return null;
  if (!(chordSum > 0)) return { k0: 1, chordSum: 0, note: "Без отверстий — K₀ = 1", error: null };
  if (chordSum >= Dp) {
    return { k0: 0, chordSum, note: "", error: "Сумма хорд отверстий должна быть меньше Dₚ" };
  }
  if (chordSum > MAX_CHORD_RATIO * Dp) {
    return {
      k0: 0,
      chordSum,
      note: "",
      error: `Σdᵢ = ${fmtChord(chordSum)} мм > 0,7·Dₚ = ${fmtChord(MAX_CHORD_RATIO * Dp)} мм`,
    };
  }
  const k0 = Math.sqrt(Dp / (Dp - chordSum));
  return {
    k0,
    chordSum,
    note: single
      ? `K₀ = √(Dₚ/(Dₚ−d₁)), d₁ = ${fmtChord(chordSum)} мм`
      : `K₀ = √(Dₚ/(Dₚ−Σdᵢ)), Σdᵢ = ${fmtChord(chordSum)} мм`,
    error: null,
  };
}

/** Одно отверстие — формула (73) */
export function calcFlatHeadK0Single(d1: number, Dp: number): FlatHeadK0Result {
  if (!(d1 > 0)) return { k0: 1, chordSum: 0, note: "Без отверстий — K₀ = 1", error: null };
  const result = sqrtK0(Dp, d1, true);
  if (!result) return { k0: 1, chordSum: 0, note: "", error: "Некорректный расчётный диаметр Dₚ" };
  return result;
}

/**
 * Несколько отверстий на диаметрали — формула (74).
 * Для отверстий на одной диаметрали Σdᵢ = d₁ + d₂ + … (как в stresscalc.ru).
 */
export function calcFlatHeadK0Multiple(holes: FlatHeadHoleInput[], Dp: number): FlatHeadK0Result {
  const active = holes.map((h) => h.diameter).filter((d) => d > 0);
  if (active.length === 0) {
    return { k0: 1, chordSum: 0, note: "Без отверстий — K₀ = 1", error: null };
  }
  if (active.length === 1) return calcFlatHeadK0Single(active[0], Dp);

  const chordSum = active.reduce((a, b) => a + b, 0);
  const result = sqrtK0(Dp, chordSum, false);
  if (!result) return { k0: 1, chordSum: 0, note: "", error: "Некорректный расчётный диаметр Dₚ" };
  return result;
}

export function resolveFlatHeadK0(
  holeCount: 0 | 1 | 2 | 3,
  diameters: [number, number, number],
  Dp: number,
  manualK0?: number
): FlatHeadK0Result {
  const holes: FlatHeadHoleInput[] = [];
  for (let i = 0; i < holeCount; i++) {
    const d = diameters[i];
    if (d > 0) holes.push({ diameter: d });
  }

  if (holes.length === 0) {
    const k0 = manualK0 != null && manualK0 > 0 ? manualK0 : 1;
    return {
      k0,
      chordSum: 0,
      note: manualK0 != null && manualK0 > 0 ? "K₀ задан вручную" : "Без отверстий — K₀ = 1",
      error: null,
    };
  }

  return calcFlatHeadK0Multiple(holes, Dp);
}
