import type { SteelGrade } from "@/types/steel";
import type { PnaeAllowableMode } from "@/lib/steelHandbook";
import { interpolateAtTemp } from "@/lib/steelHandbook";

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
 * Расчет σ / σ13 / σRV для интерфейса, где пользователь выбирает режим (как в ПНАЭ).
 * На текущем этапе σ (σ) берётся из табличных значений приложения A
 * (поле `grade.gost34233_1.allowableSigma`), σ13 и σRV выводятся
 * через коэффициенты из формул/коэффициентов ГОСТ (первая рабочая версия).
 */
export function computeGostAllowableByMode(
  mode: PnaeAllowableMode,
  grade: SteelGrade | undefined,
  options: {
    temperature?: number;
  } = {}
): GostAllowableByModeResult | null {
  const { temperature = 20 } = options;
  if (!grade) return null;

  const sigmaMap = grade.gost34233_1?.allowableSigma;
  const sigma = interpolateAtTemp(sigmaMap, temperature);
  if (sigma == null || !Number.isFinite(sigma) || sigma <= 0) return null;

  // Рабочая версия коэффициентов:
  // - для σ13 используем коэффициент 1.3 (в ПНАЭ он берётся как 1.3 σ),
  // - для σRV используем 1.4 (из 8.10 в тексте ГОСТ встречается Нr=1,4H).
  const sigma13 = sigma * 1.3;
  const sigmaRV = sigma * 1.4;

  return {
    sigma: round1(sigma),
    sigma13: round1(sigma13),
    sigmaRV: round1(sigmaRV),
    applicable: true,
    conditionNote:
      mode === "pressure_external"
        ? "Условия: наружное давление (подпись)"
        : mode === "bolt"
          ? "Условия: болты/шпильки (подпись)"
          : mode === "containment_shell"
            ? "Условия: страховочные оболочки (подпись)"
            : "Условия: внутреннее давление (подпись)",
    incomplete: false,
    tt: 0,
  };
}

