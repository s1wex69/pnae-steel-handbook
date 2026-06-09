/**
 * Расчёт допускаемых напряжений по ИН № 1 (ПНАЭ Г-7-002-86).
 * Единый источник формул для API и справочника ПНАЭ.
 */

export const IN1_STANDARD = "ИН № 1, ПНАЭ Г-7-002-86";

export const allowableStressModes = [
  "pressure_internal",
  "pressure_external",
  "bolt",
  "bolt_high_temp",
  "containment_shell",
  "stress_range_equipment",
  "stress_range_piping",
] as const;

export type AllowableStressMode = (typeof allowableStressModes)[number];

export const modeLabels: Record<AllowableStressMode, string> = {
  pressure_internal: "Оборудование / трубопроводы — внутреннее давление",
  pressure_external: "Оборудование / трубопроводы — наружное давление > внутреннего",
  bolt: "Болты и шпильки (давление / затяжка)",
  bolt_high_temp: "Болты и шпильки при T > Tt",
  containment_shell: "Корпуса страховочных и защитных оболочек",
  stress_range_equipment: "Размах напряжений (σ)RV — оборудование",
  stress_range_piping: "Размах напряжений (σ)RK — трубопроводы",
};

/** Коэффициенты запаса по ИН № 1 */
export const IN1_COEFFICIENTS = {
  pressureInternal: { nm: 2.6, n02: 1.5, nmt: 1.5 },
  pressureExternal: { nm: 2.6, n02: 2, nmt: 2 },
  bolt: { n02: 2 },
  boltHighTemp: { nmt: 3 },
  containmentShell: { nm: 1.85, n02: 1.07 },
  stressRangeCap: 2,
  stressRangeFactor: 2.5,
  sigma13Factor: 1.3,
} as const;

/** Группы стали с Tt = 450 °C (п. 4 ИН № 1) */
const TT_450_GROUPS = new Set([
  "Сталь хромоникелевая коррозионно-стойкого аустенитного класса",
  "Сталь легированная хромомолибденованадиевая",
  "Сплав на железоникелевой основе",
]);

/** Категории справочника с Tt = 450 °C */
const TT_450_CATEGORY_IDS = new Set(["austenitic", "pearlitic_crmo", "fe_ni"]);

/**
 * Пороговая температура Tt, °C (ИН № 1).
 * Углеродистые, легированные, кремнемарганцовистые, высокохромистые — 350 °C.
 * Аустенитные, жаропрочные Cr-Mo-V, Fe-Ni — 450 °C.
 */
export function in1ThresholdT(options: {
  materialGroup?: string | null;
  categoryId?: string | null;
} = {}): number {
  const { materialGroup, categoryId } = options;
  if (materialGroup && TT_450_GROUPS.has(materialGroup)) return 450;
  if (categoryId && TT_450_CATEGORY_IDS.has(categoryId)) return 450;
  return 350;
}

export function in1UsesLongTermStrength(temperature: number, tt: number): boolean {
  return Number.isFinite(temperature) && temperature > tt;
}

export function minPositive(...values: number[]): number {
  const valid = values.filter((v) => Number.isFinite(v) && v > 0);
  if (valid.length === 0) return NaN;
  return Math.min(...valid);
}

export interface PressureSigmaInput {
  rm: number;
  rp02: number;
  rmt?: number | null;
  temperature: number;
  external?: boolean;
  tt?: number;
  materialGroup?: string | null;
  categoryId?: string | null;
}

export interface PressureSigmaResult {
  sigma: number;
  sigma13: number;
  stressRange: number;
  rmtIncluded: boolean;
  tt: number;
  longTermRequired: boolean;
  rmtMissing: boolean;
}

export function in1PressureSigma(input: PressureSigmaInput): PressureSigmaResult | null {
  const { rm, rp02, rmt, temperature, external = false } = input;
  if (!(rm > 0 && rp02 > 0 && rp02 <= rm)) return null;

  const tt = input.tt ?? in1ThresholdT(input);
  const coeffs = external ? IN1_COEFFICIENTS.pressureExternal : IN1_COEFFICIENTS.pressureInternal;
  const longTermRequired = in1UsesLongTermStrength(temperature, tt);

  const candidates = [rm / coeffs.nm, rp02 / coeffs.n02];
  let rmtIncluded = false;
  if (longTermRequired && rmt != null && rmt > 0) {
    candidates.push(rmt / coeffs.nmt);
    rmtIncluded = true;
  }

  const sigma = minPositive(...candidates);
  if (!Number.isFinite(sigma)) return null;

  const uncapped = (IN1_COEFFICIENTS.stressRangeFactor - rp02 / rm) * rp02;
  const stressRange = Math.min(uncapped, IN1_COEFFICIENTS.stressRangeCap * rp02);

  return {
    sigma,
    sigma13: IN1_COEFFICIENTS.sigma13Factor * sigma,
    stressRange,
    rmtIncluded,
    tt,
    longTermRequired,
    rmtMissing: longTermRequired && !rmtIncluded,
  };
}

export interface AllowableByModeInput {
  mode: AllowableStressMode;
  rm: number;
  rp02: number;
  rmt?: number | null;
  temperature?: number;
  tt?: number;
  materialGroup?: string | null;
  categoryId?: string | null;
}

export interface AllowableByModeResult {
  sigma: number | null;
  sigma13: number | null;
  sigmaRV: number | null;
  applicable: boolean;
  tt: number;
  conditionNote: string;
  incomplete?: boolean;
}

export function in1AllowableByMode(input: AllowableByModeInput): AllowableByModeResult | null {
  const { mode, rm, rp02, rmt, temperature, materialGroup, categoryId } = input;
  if (!(rm > 0 && rp02 > 0 && rp02 <= rm)) return null;

  const tt = input.tt ?? in1ThresholdT({ materialGroup, categoryId });
  const t = temperature ?? 20;

  switch (mode) {
    case "pressure_internal": {
      const p = in1PressureSigma({
        rm,
        rp02,
        rmt,
        temperature: t,
        tt,
        materialGroup,
        categoryId,
        external: false,
      });
      if (!p) return null;
      return {
        sigma: p.sigma,
        sigma13: p.sigma13,
        sigmaRV: p.stressRange,
        applicable: true,
        tt: p.tt,
        conditionNote: p.longTermRequired
          ? p.rmtMissing
            ? `T > Tt (${p.tt} °C), R_mt не задан`
            : `T > Tt (${p.tt} °C)`
          : `T ≤ Tt (${p.tt} °C)`,
        incomplete: p.rmtMissing,
      };
    }
    case "pressure_external": {
      const p = in1PressureSigma({
        rm,
        rp02,
        rmt,
        temperature: t,
        tt,
        materialGroup,
        categoryId,
        external: true,
      });
      if (!p) return null;
      return {
        sigma: p.sigma,
        sigma13: p.sigma13,
        sigmaRV: p.stressRange,
        applicable: true,
        tt: p.tt,
        conditionNote: p.longTermRequired
          ? p.rmtMissing
            ? `T > Tt (${p.tt} °C), R_mt не задан`
            : `T > Tt (${p.tt} °C)`
          : `T ≤ Tt (${p.tt} °C)`,
        incomplete: p.rmtMissing,
      };
    }
    case "bolt":
      return {
        sigma: rp02 / IN1_COEFFICIENTS.bolt.n02,
        sigma13: null,
        sigmaRV: null,
        applicable: true,
        tt,
        conditionNote: "[σ]_w = Rp0,2 / 2",
      };
    case "bolt_high_temp": {
      if (!in1UsesLongTermStrength(t, tt)) {
        return {
          sigma: null,
          sigma13: null,
          sigmaRV: null,
          applicable: false,
          tt,
          conditionNote: `T ≤ Tt (${tt} °C)`,
        };
      }
      return {
        sigma: rm / IN1_COEFFICIENTS.boltHighTemp.nmt,
        sigma13: null,
        sigmaRV: null,
        applicable: true,
        tt,
        conditionNote: `T > Tt (${tt} °C)`,
      };
    }
    case "containment_shell": {
      const sigma = minPositive(
        rm / IN1_COEFFICIENTS.containmentShell.nm,
        rp02 / IN1_COEFFICIENTS.containmentShell.n02
      );
      if (!Number.isFinite(sigma)) return null;
      return {
        sigma,
        sigma13: null,
        sigmaRV: null,
        applicable: true,
        tt,
        conditionNote: "[σ]_c",
      };
    }
    case "stress_range_equipment":
    case "stress_range_piping": {
      const uncapped = (IN1_COEFFICIENTS.stressRangeFactor - rp02 / rm) * rp02;
      const sigma = Math.min(uncapped, IN1_COEFFICIENTS.stressRangeCap * rp02);
      const symbol = mode === "stress_range_equipment" ? "RV" : "RK";
      return {
        sigma,
        sigma13: null,
        sigmaRV: null,
        applicable: true,
        tt,
        conditionNote: `(σ)_${symbol}`,
      };
    }
    default:
      return null;
  }
}

export type Candidate = { id: string; label: string; value: number; formula: string };

export function minCandidate(candidates: Candidate[]): Candidate {
  const valid = candidates.filter((c) => Number.isFinite(c.value) && c.value > 0);
  if (valid.length === 0) throw new Error("Нет допустимых значений для расчёта");
  return valid.reduce((a, b) => (a.value <= b.value ? a : b));
}

export interface In1CalcInput {
  mode: AllowableStressMode;
  rm: number;
  rp02: number;
  rmt?: number | null;
  designTemperature?: number;
  boltThresholdT?: number;
  materialGroup?: string | null;
  categoryId?: string | null;
}

export interface In1CalcResult {
  mode: AllowableStressMode;
  modeLabel: string;
  standard: string;
  formula: string;
  coefficients?: Record<string, number>;
  inputs: Record<string, unknown>;
  results: Record<string, number | string | boolean | null>;
  candidates?: Candidate[];
  notes?: string[];
}

export function calculateIn1AllowableStress(input: In1CalcInput): In1CalcResult {
  const {
    mode,
    rm,
    rp02,
    rmt,
    designTemperature,
    boltThresholdT,
    materialGroup,
    categoryId,
  } = input;

  if (rp02 > rm) {
    throw new Error("Rp0,2 не может превышать Rm");
  }

  const tt =
    boltThresholdT ?? in1ThresholdT({ materialGroup, categoryId });
  const temperature = designTemperature ?? 20;

  const base = {
    mode,
    modeLabel: modeLabels[mode],
    inputs: {
      rm,
      rp02,
      rmt,
      designTemperature,
      boltThresholdT: tt,
      materialGroup,
      categoryId,
    },
    standard: IN1_STANDARD,
  };

  switch (mode) {
    case "pressure_internal":
    case "pressure_external": {
      const external = mode === "pressure_external";
      const p = in1PressureSigma({
        rm,
        rp02,
        rmt,
        temperature,
        tt,
        materialGroup,
        categoryId,
        external,
      });
      if (!p) throw new Error("Нет допустимых значений для расчёта");

      const coeffs = external
        ? IN1_COEFFICIENTS.pressureExternal
        : IN1_COEFFICIENTS.pressureInternal;

      const candidates: Candidate[] = [
        { id: "rm", label: "Rm / n_m", value: rm / coeffs.nm, formula: `n_m = ${coeffs.nm}` },
        {
          id: "rp02",
          label: "Rp0,2 / n_0,2",
          value: rp02 / coeffs.n02,
          formula: `n_0,2 = ${coeffs.n02}`,
        },
      ];
      if (p.rmtIncluded && rmt != null) {
        candidates.push({
          id: "rmt",
          label: "R_mt / n_mt",
          value: rmt / coeffs.nmt,
          formula: `n_mt = ${coeffs.nmt}`,
        });
      }

      const governing = minCandidate(candidates);
      const notes: string[] = [];
      if (p.longTermRequired) {
        notes.push(`T = ${temperature} °C > Tt = ${tt} °C — учёт R_mt`);
      } else {
        notes.push(`T = ${temperature} °C ≤ Tt = ${tt} °C — расчёт по Rm и Rp0,2`);
      }
      if (p.rmtMissing) {
        notes.push("R_mt не задан — результат может быть завышен");
      }

      return {
        ...base,
        formula: "[σ] = min( Rm/n_m ; Rp0,2/n_0,2 ; R_mt/n_mt )",
        coefficients: { nm: coeffs.nm, n02: coeffs.n02, nmt: coeffs.nmt },
        results: {
          allowableStress: governing.value,
          governingTerm: governing.label,
          ...Object.fromEntries(candidates.map((c) => [c.id, c.value])),
          rmtUsed: p.rmtIncluded,
          thresholdT: tt,
          longTermRequired: p.longTermRequired,
        },
        candidates,
        notes,
      };
    }

    case "bolt": {
      const sigmaW = rp02 / IN1_COEFFICIENTS.bolt.n02;
      return {
        ...base,
        formula: "[σ]_w = Rp0,2 / n_0,2",
        coefficients: { n02: IN1_COEFFICIENTS.bolt.n02 },
        results: {
          allowableStress: sigmaW,
          sigmaW,
          governingTerm: "Rp0,2 / n_0,2",
          thresholdT: tt,
        },
        candidates: [
          {
            id: "sigmaW",
            label: "[σ]_w",
            value: sigmaW,
            formula: `n_0,2 = ${IN1_COEFFICIENTS.bolt.n02}`,
          },
        ],
      };
    }

    case "bolt_high_temp": {
      const applies = in1UsesLongTermStrength(temperature, tt);
      const sigmaWt = rm / IN1_COEFFICIENTS.boltHighTemp.nmt;
      return {
        ...base,
        formula: "[σ]_wt = Rm / n_mt",
        coefficients: { nmt: IN1_COEFFICIENTS.boltHighTemp.nmt },
        results: {
          allowableStress: applies ? sigmaWt : null,
          sigmaWt,
          temperatureApplies: applies,
          governingTerm: applies ? "Rm / n_mt" : "T ≤ Tt — [σ]_wt не устанавливается",
          thresholdT: tt,
        },
        candidates: [
          {
            id: "sigmaWt",
            label: "[σ]_wt",
            value: sigmaWt,
            formula: `n_mt = ${IN1_COEFFICIENTS.boltHighTemp.nmt}`,
          },
        ],
        notes: applies
          ? [`T = ${temperature} °C > Tt = ${tt} °C`]
          : [`T = ${temperature} °C ≤ Tt = ${tt} °C — доп. напряжение не требуется`],
      };
    }

    case "containment_shell": {
      const candidates: Candidate[] = [
        {
          id: "rm",
          label: "Rm / n_m",
          value: rm / IN1_COEFFICIENTS.containmentShell.nm,
          formula: `n_m = ${IN1_COEFFICIENTS.containmentShell.nm}`,
        },
        {
          id: "rp02",
          label: "Rp0,2 / n_0,2",
          value: rp02 / IN1_COEFFICIENTS.containmentShell.n02,
          formula: `n_0,2 = ${IN1_COEFFICIENTS.containmentShell.n02}`,
        },
      ];
      const governing = minCandidate(candidates);
      return {
        ...base,
        formula: "[σ]_c = min( Rm/n_m ; Rp0,2/n_0,2 )",
        coefficients: {
          nm: IN1_COEFFICIENTS.containmentShell.nm,
          n02: IN1_COEFFICIENTS.containmentShell.n02,
        },
        results: {
          allowableStress: governing.value,
          sigmaC: governing.value,
          governingTerm: governing.label,
          thresholdT: tt,
          ...Object.fromEntries(candidates.map((c) => [c.id, c.value])),
        },
        candidates,
      };
    }

    case "stress_range_equipment":
    case "stress_range_piping": {
      const uncapped = (IN1_COEFFICIENTS.stressRangeFactor - rp02 / rm) * rp02;
      const cap = IN1_COEFFICIENTS.stressRangeCap * rp02;
      const sigma = Math.min(uncapped, cap);
      const symbol = mode === "stress_range_equipment" ? "RV" : "RK";
      return {
        ...base,
        formula: `(σ)_${symbol} = (2,5 − Rp0,2/Rm)·Rp0,2 ≤ 2·Rp0,2`,
        results: {
          allowableStress: sigma,
          stressRange: sigma,
          stressRangeUncapped: uncapped,
          stressRangeCap: cap,
          ratioRp02Rm: rp02 / rm,
          limitedByCap: uncapped > cap,
          governingTerm:
            uncapped > cap ? "Ограничение 2·Rp0,2" : "Формула (2,5 − Rp0,2/Rm)·Rp0,2",
          thresholdT: tt,
        },
        candidates: [
          { id: "calculated", label: "Расчётное", value: uncapped, formula: "" },
          { id: "cap", label: "Предел 2·Rp0,2", value: cap, formula: "" },
          { id: "result", label: `(σ)_${symbol}`, value: sigma, formula: "" },
        ],
      };
    }
  }
}
