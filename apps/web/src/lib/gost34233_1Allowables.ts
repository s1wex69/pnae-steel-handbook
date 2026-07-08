import type { SteelGrade, SteelHandbook } from "@/types/steel";
import {
  type PnaeAllowableMode,
  computePnaeAllowableByMode,
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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Расчёт σ / σ13 / σRV для справочника ГОСТ 34233.1.
 * Приоритет: табличные значения приложения А (`grade.gost34233_1.allowableSigma`).
 * Если таблицы нет — расчёт по Rm/Rp0,2 (как в ПНАЭ, до полного парсинга всех табл. А).
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

  const sigmaMap = grade.gost34233_1?.allowableSigma;
  const tabulatedSigma = interpolateAtTemp(sigmaMap, temperature);

  if (sigmaMap && tabulatedSigma != null && Number.isFinite(tabulatedSigma) && tabulatedSigma > 0) {
    const sigma = tabulatedSigma;
    const sigma13 = sigma * 1.3;
    const sigmaRV = sigma * 1.4;
    return {
      sigma: round1(sigma),
      sigma13: round1(sigma13),
      sigmaRV: round1(sigmaRV),
      applicable: true,
      conditionNote: modeNote(mode),
      incomplete: false,
      tt: 0,
    };
  }

  const rm = interpolatedValue(grade, "rm", temperature);
  const rp02 = interpolatedValue(grade, "rp02", temperature);
  if (rm == null || rp02 == null || rm <= 0 || rp02 <= 0 || rp02 > rm) return null;

  const categoryId =
    handbook && grade.mark ? findGostCategoryIdForMark(handbook, grade.mark) : undefined;

  const pnae = computePnaeAllowableByMode(mode, rm, rp02, {
    temperature,
    materialGroup: grade.group,
    categoryId,
  });
  if (!pnae || pnae.sigma == null) return null;

  return {
    sigma: pnae.sigma,
    sigma13: pnae.sigma13,
    sigmaRV: pnae.sigmaRV,
    applicable: pnae.applicable,
    conditionNote: pnae.conditionNote,
    incomplete: pnae.incomplete,
    tt: pnae.tt,
  };
}

function modeNote(mode: PnaeAllowableMode): string {
  switch (mode) {
    case "pressure_external":
      return "Условия: наружное давление";
    case "bolt":
      return "Условия: болты/шпильки";
    case "containment_shell":
      return "Условия: страховочные оболочки";
    default:
      return "Условия: внутреннее давление";
  }
}
