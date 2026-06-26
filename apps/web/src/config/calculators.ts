export type FieldType = "number" | "select";

export interface CalcField {
  key: string;
  label: string;
  unit?: string;
  type?: FieldType;
  step?: string;
  min?: string;
  max?: string;
  default: string;
  options?: { value: string; label: string }[];
  hint?: string;
  optional?: boolean;
}

export interface ResultField {
  key: string;
  label: string;
  unit?: string;
  highlight?: boolean;
}

export interface CalculatorConfig {
  id: string;
  title: string;
  subtitle: string;
  standard: string;
  methodologySlug?: string;
  formulaLatex: string;
  fields: CalcField[];
  resultFields: ResultField[];
  requiredKeys: string[];
}

export const CALCULATOR_CONFIGS: Record<string, CalculatorConfig> = {
  "in-1-allowable-stress": {
    id: "in-1-allowable-stress",
    title: "ИН № 1 — Допускаемые напряжения",
    subtitle: "7 вариантов по ПНАЭ: давление, болты, оболочки, размах напряжений",
    standard: "ПНАЭ Г-7-002-86",
    methodologySlug: "in-1-dopuskaemye-napryazheniya",
    formulaLatex: "[\\sigma] = \\min\\left\\{\\frac{R_m^T}{n_m};\\frac{R_{p0,2}^T}{n_{0,2}};\\frac{R_{mt}^T}{n_{mt}}\\right\\}",
    fields: [],
    resultFields: [],
    requiredKeys: [],
  },
  "in-2-wall-allowance": {
    id: "in-2-wall-allowance",
    title: "ИН № 2 — Прибавка к толщине стенки",
    subtitle: "Суммарная прибавка c₁ + c₂ + c₃",
    standard: "ГОСТ 19903-74 / ГОСТ 25347-82",
    formulaLatex: "c = c_1 + c_2 + |c_3|",
    fields: [
      { key: "corrosionRate", label: "Скорость коррозии", unit: "мм/год", default: "0.1", step: "0.01" },
      { key: "serviceLife", label: "Срок службы", unit: "лет", default: "20" },
      { key: "corrosionAllowance", label: "c₁ задана напрямую", unit: "мм", default: "0", hint: "Если > 0, скорость не используется" },
      { key: "additionalAllowance", label: "Технологическая c₂", unit: "мм", default: "0" },
      { key: "negativeTolerance", label: "Отриц. допуск c₃", unit: "мм", default: "0" },
    ],
    resultFields: [
      { key: "corrosionAllowance", label: "c₁ (коррозия)", unit: "мм" },
      { key: "designAllowance", label: "c₁ + c₂", unit: "мм" },
      { key: "totalAllowance", label: "Суммарная c", unit: "мм", highlight: true },
    ],
    requiredKeys: [],
  },
};

export const CALCULATOR_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.values(CALCULATOR_CONFIGS).map((c) => [c.id, c.title])),
  "cylindrical-shell-internal": "Цилиндрическая обечайка — внутреннее давление",
  "cylindrical-shell-external": "Цилиндрическая обечайка — наружное давление",
  "hemispherical-head": "Полусферическое днище — внутреннее давление",
  "elliptical-head": "Эллиптическое днище — внутреннее давление",
  "torispherical-head": "Торосферическое днище — внутреннее давление",
  "pipe-internal": "Расчёт на прочность трубы, штуцера, коллектора",
  elbow: "Расчёт колена на внутреннее давление",
  "bolts-studs-nuts": "Расчёт болтов, шпилек и гаек",
  "conical-shell-internal": "Расчёт на прочность конической обечайки, нагруженной внутренним избыточным давлением",
  "flat-bottom": "Плоское круглое днище",
  "flat-cover": "Плоская круглая крышка",
};
