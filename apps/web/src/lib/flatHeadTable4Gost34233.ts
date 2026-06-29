/** Таблица 4 ГОСТ 34233.2-2017 — коэффициент K и расчётный диаметр Dₚ */

export type FlatHeadAttachmentType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface FlatHeadGeometry {
  D: number;
  /** Исполнительная толщина обечайки s */
  sShell: number;
  /** Номинальная толщина днища / крышки s₁ (для отношения толщин) */
  s1: number;
  cShell: number;
  cHead: number;
  /** Катет шва a (типы 1, 2, 6) */
  a?: number;
  /** Радиус выточки r (типы 9, 10) */
  r?: number;
  /** Прямолинейный участок h₁ (тип 9) */
  h1?: number;
  /** Угол γ, град (тип 10) */
  gammaDeg?: number;
  /** Толщина s₂ в канавке (тип 10) */
  s2Groove?: number;
  /** D₃ — диаметр болтовой окружности (типы 11, 12) */
  D3?: number;
  /** Dс.п — средний диаметр прокладки (тип 12) */
  Dcp?: number;
  /** D₂ — наименьший наружный диаметр утонённой части (типы 11, 12) */
  D2?: number;
  /** Dₚ для типа 1 при Dₚ > D */
  DpOverride?: number;
}

export interface FlatHeadKResult {
  K: number;
  Dp: number;
  note: string;
}

const RATIO_K_025 = { low: 0.45, high: 0.41 } as const;
const RATIO_K_05 = { low: 0.41, high: 0.38 } as const;

function shellHeadRatio(geom: FlatHeadGeometry): number | null {
  const sEff = geom.sShell - geom.cShell;
  const s1Eff = geom.s1 - geom.cHead;
  if (!(sEff > 0) || !(s1Eff > 0)) return null;
  return sEff / s1Eff;
}

function kFromRatio(ratio: number | null, thresholds: { low: number; high: number }, limit: number) {
  if (ratio == null) return thresholds.low;
  return ratio < limit ? thresholds.low : thresholds.high;
}

/** K по типу крепления (табл. 4) */
export function calcFlatHeadK(type: FlatHeadAttachmentType, geom: FlatHeadGeometry): FlatHeadKResult {
  const ratio = shellHeadRatio(geom);

  switch (type) {
    case 1:
      return { K: 0.53, Dp: geom.DpOverride != null && geom.DpOverride >= geom.D ? geom.DpOverride : geom.D, note: "a ≥ 1,7s; Dₚ ≥ D" };
    case 2:
      return { K: 0.5, Dp: geom.D, note: "a ≥ 0,85s; Dₚ = D" };
    case 3: {
      const K = kFromRatio(ratio, RATIO_K_025, 0.25);
      return { K, Dp: geom.D, note: "(s−c)/(s₁−c) < 0,25 → 0,45; ≥ 0,25 → 0,41" };
    }
    case 4: {
      const K = kFromRatio(ratio, RATIO_K_05, 0.5);
      return { K, Dp: geom.D, note: "(s−c)/(s₁−c) < 0,5 → 0,41; ≥ 0,5 → 0,38" };
    }
    case 5: {
      const K = kFromRatio(ratio, RATIO_K_025, 0.25);
      return { K, Dp: geom.D, note: "(s−c)/(s₁−c) < 0,25 → 0,45; ≥ 0,25 → 0,41" };
    }
    case 6:
      return { K: 0.5, Dp: geom.D, note: "a ≥ 0,85s; Dₚ = D" };
    case 7: {
      const K = kFromRatio(ratio, RATIO_K_05, 0.5);
      return { K, Dp: geom.D, note: "(s−c)/(s₁−c) < 0,5 → 0,41; ≥ 0,5 → 0,38" };
    }
    case 8: {
      const K = kFromRatio(ratio, RATIO_K_05, 0.5);
      return { K, Dp: geom.D, note: "(s−c)/(s₁−c) < 0,5 → 0,41; ≥ 0,5 → 0,38" };
    }
    case 9: {
      const K = kFromRatio(ratio, RATIO_K_05, 0.5);
      const r = geom.r ?? 0;
      return {
        K,
        Dp: geom.D - 2 * r,
        note: "h₁ ≥ r; max{s; 0,25s₁} ≤ r ≤ min{s₁; 0,1D}; Dₚ = D − 2r",
      };
    }
    case 10: {
      const K = kFromRatio(ratio, RATIO_K_05, 0.5);
      return { K, Dp: geom.D, note: "30° ≤ γ ≤ 90°; Dₚ = D" };
    }
    case 11: {
      const D3 = geom.D3 ?? geom.D;
      return { K: 0.4, Dp: D3, note: "Dₚ = D₃ — болтовое соединение" };
    }
    case 12: {
      const Dcp = geom.Dcp ?? geom.D;
      return { K: 0.41, Dp: Dcp, note: "Dₚ = Dс.п — по диаметру прокладки" };
    }
    default:
      return { K: 0.53, Dp: geom.D, note: "" };
  }
}

/** Итеративный расчёт K для типов с зависимостью от s₁ */
export function resolveFlatHeadK(
  type: FlatHeadAttachmentType,
  geom: FlatHeadGeometry,
  solveS1: (K: number, Dp: number) => number | null,
  maxIter = 8
): FlatHeadKResult & { s1Resolved: number | null } {
  let { K, Dp, note } = calcFlatHeadK(type, { ...geom, s1: geom.s1 || geom.sShell });
  let s1Resolved: number | null = null;

  const ratioTypes: FlatHeadAttachmentType[] = [3, 4, 5, 7, 8, 9, 10];
  if (!ratioTypes.includes(type)) {
    s1Resolved = solveS1(K, Dp);
    return { K, Dp, note, s1Resolved };
  }

  let s1Guess = geom.s1 > 0 ? geom.s1 : geom.sShell;
  for (let i = 0; i < maxIter; i++) {
    const result = calcFlatHeadK(type, { ...geom, s1: s1Guess });
    K = result.K;
    Dp = result.Dp;
    note = result.note;
    const nextS1 = solveS1(K, Dp);
    if (nextS1 == null) break;
    if (Math.abs(nextS1 - s1Guess) < 0.01) {
      s1Resolved = nextS1;
      break;
    }
    s1Guess = nextS1;
    s1Resolved = nextS1;
  }

  return { K, Dp, note, s1Resolved };
}

export const FLAT_HEAD_TYPE_LABELS: Record<FlatHeadAttachmentType, string> = {
  1: "Приварное днище с опорным буртом",
  2: "Приварное днище без бурта",
  3: "Вварное днище",
  4: "Вварное днище (двусторонний шов)",
  5: "Приварное днище к торцу обечайки",
  6: "Приварное днище с нависанием",
  7: "Вварное днище с нависанием",
  8: "Приварное с фаской",
  9: "С выточкой радиусом r",
  10: "С рельефной канавкой",
  11: "Болтовое соединение",
  12: "Соединение с прокладкой",
};

export const FLAT_HEAD_TYPES_BOTTOM: FlatHeadAttachmentType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const FLAT_HEAD_TYPES_COVER: FlatHeadAttachmentType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
/** Все типы по табл. 4 — единый расчёт §7.2 (как stresscalc.ru) */
export const FLAT_HEAD_TYPES_ALL: FlatHeadAttachmentType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
