import type { SteelGrade, SteelHandbook } from "@/types/steel";
import {
  type PnaeAllowableMode,
  findGostCategoryIdForMark,
  interpolateAtTemp,
  interpolatedValue,
} from "@/lib/steelHandbook";

export type GostAllowableByModeResult = {
  sigma: number | null;
  sigma13: number | null;
  sigmaRV: number | null;
  applicable: boolean;
  conditionNote: string;
  incomplete?: boolean;
  tt: number;
};

/** Класс материала по п. 8.1 ГОСТ 34233.1—2017 */
export type GostMaterialFormulaClass =
  | "formula1"
  | "formula2"
  | "formula3"
  | "formula4_titanium";

/** Коэффициенты запаса прочности — таблица 1, рабочие условия */
export const GOST_TABLE1_WORKING = {
  formula1: { nt: 1.5, nv: 1.0, nd: 1.5 },
  formula2: { nt: 1.3, nv: 3.0, nd: 1.5 },
  formula3: { nm: 2.4 },
  formula4_sheet: { nvt: 2.6 },
  formula4_forging: { nvt: 3.0 },
} as const;

/** Коэффициенты для условий испытания (гидравлические) — таблица 1 */
export const GOST_TABLE1_TEST_HYDRAULIC = {
  formula1: { nt: 1.1, nv: 1.0, nd: 1.1 },
  formula2: { nt: 1.1, nv: 1.8, nd: 1.1 },
  formula3: { nm: 1.8 },
  formula4_sheet: { nvt: 1.8 },
  formula4_forging: { nvt: 1.8 },
} as const;

const SIGMA13_FACTOR = 1.3;
const SIGMA_RV_FACTOR = 1.4;

const TT_450_GROUPS = new Set([
  "Сталь хромоникелевая коррозионно-стойкого аустенитного класса",
  "Сталь легированная хромомолибденованадиевая",
  "Сплав на железоникелевой основе",
]);

const TT_450_CATEGORY_IDS = new Set(["austenitic", "pearlitic_crmo", "fe_ni", "titanium", "aluminum", "copper"]);

function isAluminumOrCopper(grade: SteelGrade, categoryId?: string | null): boolean {
  return (
    grade.classId === "ALUMINUM" ||
    grade.classId === "COPPER" ||
    grade.group === "Алюминий и его сплавы" ||
    grade.group === "Медь и её сплавы" ||
    categoryId === "aluminum" ||
    categoryId === "copper"
  );
}

function gostThresholdT(options: {
  materialGroup?: string | null;
  categoryId?: string | null;
}): number {
  const { materialGroup, categoryId } = options;
  if (materialGroup && TT_450_GROUPS.has(materialGroup)) return 450;
  if (categoryId && TT_450_CATEGORY_IDS.has(categoryId)) return 450;
  return 350;
}

function minPositive(...values: number[]): number {
  const valid = values.filter((v) => Number.isFinite(v) && v > 0);
  if (valid.length === 0) return NaN;
  return Math.min(...valid);
}

/** Округление вниз до 0,5 МПа (п. 2 примечаний к приложению А) */
export function roundDownHalfMpa(value: number): number {
  return Math.floor(value * 2) / 2;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function deriveSigma13Rv(sigma: number): { sigma13: number; sigmaRV: number } {
  return {
    sigma13: round1(sigma * SIGMA13_FACTOR),
    sigmaRV: round1(sigma * SIGMA_RV_FACTOR),
  };
}

/** Определение формулы п. 8.1 по марке, группе и classId */
export function detectGostMaterialFormulaClass(
  grade: SteelGrade,
  categoryId?: string | null
): GostMaterialFormulaClass {
  if (grade.classId === "TITANIUM" || grade.group === "Титан" || categoryId === "titanium") {
    return "formula4_titanium";
  }
  if (isAluminumOrCopper(grade, categoryId)) {
    return "formula3";
  }
  if (
    categoryId === "austenitic" ||
    grade.group === "Сталь хромоникелевая коррозионно-стойкого аустенитного класса"
  ) {
    return "formula2";
  }
  return "formula1";
}

function isTitaniumForging(grade: SteelGrade): boolean {
  const name = grade.name.toLowerCase();
  return /поковк|прутк/i.test(name);
}

type SafetyCoeffs = { nt: number; nv: number; nd: number } | { nvt: number } | { nm: number };

function coeffsForMode(
  formulaClass: GostMaterialFormulaClass,
  mode: PnaeAllowableMode,
  grade: SteelGrade
): SafetyCoeffs {
  if (formulaClass === "formula4_titanium") {
    const forging = isTitaniumForging(grade);
    if (mode === "bolt" || mode === "containment_shell") {
      return GOST_TABLE1_TEST_HYDRAULIC.formula4_forging;
    }
    return forging ? GOST_TABLE1_WORKING.formula4_forging : GOST_TABLE1_WORKING.formula4_sheet;
  }

  if (formulaClass === "formula3") {
    const useTest =
      mode === "bolt" || mode === "containment_shell" || mode === "pressure_external";
    return useTest ? GOST_TABLE1_TEST_HYDRAULIC.formula3 : GOST_TABLE1_WORKING.formula3;
  }

  const useTest =
    mode === "bolt" || mode === "containment_shell" || mode === "pressure_external";

  if (formulaClass === "formula2") {
    return useTest ? GOST_TABLE1_TEST_HYDRAULIC.formula2 : GOST_TABLE1_WORKING.formula2;
  }
  return useTest ? GOST_TABLE1_TEST_HYDRAULIC.formula1 : GOST_TABLE1_WORKING.formula1;
}

function computeFormulaSigma(
  formulaClass: GostMaterialFormulaClass,
  coeffs: SafetyCoeffs,
  props: { rm: number; rp02: number; re?: number | null; rmt?: number | null },
  temperature: number,
  tt: number
): { sigma: number; incomplete: boolean } | null {
  const { rm, rp02 } = props;
  if (!(rm > 0 && rp02 > 0 && rp02 <= rm)) return null;

  if (formulaClass === "formula4_titanium" && "nvt" in coeffs) {
    const sigma = roundDownHalfMpa(rm / coeffs.nvt);
    return { sigma, incomplete: false };
  }

  if (formulaClass === "formula3" && "nm" in coeffs) {
    const sigma = roundDownHalfMpa(rm / coeffs.nm);
    return { sigma, incomplete: false };
  }

  if (!("nt" in coeffs)) return null;

  const candidates: number[] = [];

  if (formulaClass === "formula1") {
    const re = props.re ?? rp02;
    candidates.push(re / coeffs.nt, rp02 / coeffs.nt, rm / coeffs.nv);
    const longTerm = temperature > tt;
    if (longTerm && props.rmt != null && props.rmt > 0) {
      candidates.push(props.rmt / coeffs.nd);
    }
  } else {
    candidates.push(rp02 / coeffs.nt, rm / coeffs.nv);
    const longTerm = temperature > tt;
    if (longTerm && props.rmt != null && props.rmt > 0) {
      candidates.push(props.rmt / coeffs.nd);
    }
  }

  const raw = minPositive(...candidates);
  if (!Number.isFinite(raw)) return null;

  const incomplete =
    temperature > tt && (props.rmt == null || props.rmt <= 0) && formulaClass !== "formula4_titanium";

  return { sigma: roundDownHalfMpa(raw), incomplete };
}

function modeNote(mode: PnaeAllowableMode, tt: number, temperature: number): string {
  const tPart =
    temperature > tt ? `T > Tt (${tt} °C)` : `T ≤ Tt (${tt} °C)`;
  switch (mode) {
    case "pressure_external":
      return `Условия: наружное давление · ${tPart}`;
    case "bolt":
      return `Условия: болты/шпильки · ${tPart}`;
    case "containment_shell":
      return `Условия: страховочные оболочки · ${tPart}`;
    default:
      return `Условия: внутреннее давление · ${tPart}`;
  }
}

function tabulatedSigma(
  grade: SteelGrade,
  temperature: number
): number | null {
  const sigmaMap = grade.gost34233_1?.allowableSigma;
  const interpolated = interpolateAtTemp(sigmaMap, temperature);
  if (interpolated == null || !Number.isFinite(interpolated) || interpolated <= 0) return null;
  return roundDownHalfMpa(interpolated);
}

/**
 * Расчёт σ / σ13 / σRV для справочника ГОСТ 34233.1.
 * Приоритет: табличные значения приложения А (`grade.gost34233_1.allowableSigma`).
 * Иначе — расчёт по п. 8.1 (формулы 1, 2 или 4).
 */
export function computeGostAllowableByMode(
  mode: PnaeAllowableMode,
  grade: SteelGrade | undefined,
  options: {
    temperature?: number;
    handbook?: SteelHandbook;
  } = {}
): GostAllowableByModeResult | null {
  const { temperature = 20, handbook } = options;
  if (!grade) return null;

  const categoryId =
    handbook && grade.mark
      ? findGostCategoryIdForMark(handbook, grade.mark)
      : undefined;

  const tt = gostThresholdT({
    materialGroup: grade.group,
    categoryId,
  });

  const tabulated = tabulatedSigma(grade, temperature);
  if (tabulated != null) {
    const { sigma13, sigmaRV } = deriveSigma13Rv(tabulated);
    return {
      sigma: tabulated,
      sigma13,
      sigmaRV,
      applicable: true,
      conditionNote: `${modeNote(mode, tt, temperature)} · табл. прил. А`,
      incomplete: false,
      tt,
    };
  }

  const rm = interpolatedValue(grade, "rm", temperature);
  const rp02 = interpolatedValue(grade, "rp02", temperature);
  if (rm == null || rp02 == null) return null;

  const formulaClass = detectGostMaterialFormulaClass(grade, categoryId);
  const coeffs = coeffsForMode(formulaClass, mode, grade);

  const computed = computeFormulaSigma(
    formulaClass,
    coeffs,
    { rm, rp02, re: rp02 },
    temperature,
    tt
  );
  if (!computed) return null;

  const { sigma13, sigmaRV } = deriveSigma13Rv(computed.sigma);

  return {
    sigma: computed.sigma,
    sigma13,
    sigmaRV,
    applicable: true,
    conditionNote: `${modeNote(mode, tt, temperature)} · расчёт по п. 8.1`,
    incomplete: computed.incomplete,
    tt,
  };
}
