import type { SteelGrade, SteelHandbook, SteelPropertyKey } from "@/types/steel";

/** Текст сортамента из полного наименования (в скобках) */
export function extractSortament(name: string): string {
  const m = name.match(/\(([^)]+)\)\s*$/);
  return m ? m[1].trim() : name;
}

const MARK_ALIASES: Record<string, string> = {
  "12X2M": "12Х2М",
  "12MX": "12МХ",
  "20X": "20Х",
  "40X": "40Х",
  "15ХНМФА-А": "15Х2НМФА-А",
};

/** Приводит марку к обозначению ПНАЭ (латиница, «Сплав …», 10.0 → 10) */
export function normalizeSteelMark(mark: string): string {
  let m = mark.trim();
  if (/^\d+\.0$/.test(m)) m = String(parseInt(m, 10));
  if (m.startsWith("Сплав ")) m = m.slice("Сплав ".length);
  return MARK_ALIASES[m] ?? m;
}

export function displayMark(grade: SteelGrade): string {
  const raw =
    grade.mark ?? grade.name.split("(")[0].replace(/^Сталь\s+/i, "").trim();
  return normalizeSteelMark(raw);
}

export function findGrade(
  handbook: SteelHandbook,
  group: string,
  mark: string,
  sortament: string
): SteelGrade | undefined {
  return handbook.grades.find(
    (g) =>
      g.group === group &&
      displayMark(g) === mark &&
      extractSortament(g.name) === sortament
  );
}

export function getGroups(handbook: SteelHandbook): string[] {
  return [...new Set(handbook.grades.map((g) => g.group).filter(Boolean))].sort() as string[];
}

export function getMarks(handbook: SteelHandbook, group: string): string[] {
  const marks = handbook.grades
    .filter((g) => g.group === group)
    .map((g) => displayMark(g));
  return [...new Set(marks)].sort((a, b) => a.localeCompare(b, "ru"));
}

export function getSortaments(
  handbook: SteelHandbook,
  group: string,
  mark: string
): { sortament: string; gradeName: string }[] {
  return handbook.grades
    .filter((g) => g.group === group && displayMark(g) === mark)
    .map((g) => ({ sortament: extractSortament(g.name), gradeName: g.name }))
    .sort((a, b) => a.sortament.localeCompare(b.sortament, "ru"));
}

/** Все записи справочника для выбора без отдельного поля марки */
export function getAllGradeOptions(handbook: SteelHandbook): { gradeName: string; label: string }[] {
  return handbook.grades
    .map((g) => ({
      gradeName: g.name,
      label: `${displayMark(g)} — ${extractSortament(g.name)}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ru"));
}

export function valueAt(
  grade: SteelGrade,
  key: SteelPropertyKey,
  temp: number
): number | null {
  const map = grade[key];
  if (!map) return null;
  const v = map[String(temp)];
  return v === undefined ? null : v;
}

function tempPoints(map: Record<string, number>): { t: number; v: number }[] {
  return Object.entries(map)
    .map(([k, v]) => ({ t: Number(k), v }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);
}

function lerpAtTemp(
  temp: number,
  a: { t: number; v: number },
  b: { t: number; v: number }
): number {
  if (a.t === b.t) return a.v;
  const w = (temp - a.t) / (b.t - a.t);
  return a.v + w * (b.v - a.v);
}

/**
 * Линейная интерполяция по табличным точкам температуры.
 * Ниже минимальной и выше максимальной табличной T — линейная экстраполяция
 * по ближайшему сегменту (в т.ч. для отрицательных температур).
 */
export function interpolateAtTemp(
  map: Record<string, number> | undefined,
  temp: number
): number | null {
  if (!map || !Number.isFinite(temp)) return null;
  const points = tempPoints(map);
  if (points.length === 0) return null;
  if (points.length === 1) return points[0].v;

  if (temp <= points[0].t) {
    return lerpAtTemp(temp, points[0], points[1]);
  }
  if (temp >= points[points.length - 1].t) {
    const last = points.length - 1;
    return lerpAtTemp(temp, points[last - 1], points[last]);
  }

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (temp >= a.t && temp <= b.t) {
      return lerpAtTemp(temp, a, b);
    }
  }
  return null;
}

export function interpolatedValue(
  grade: SteelGrade,
  key: SteelPropertyKey,
  temp: number
): number | null {
  return interpolateAtTemp(grade[key], temp);
}

export interface PnaeMetalCategory {
  id: string;
  section: string;
  label: string;
  groups: string[];
}

/** Категории металла для чекбоксов (соответствуют группам в JSON) */
export const PNAE_METAL_CATEGORIES: PnaeMetalCategory[] = [
  {
    id: "pearlitic_carbon",
    section: "Стали перлитного класса",
    label: "Углеродистые",
    groups: ["Сталь углеродистая"],
  },
  {
    id: "pearlitic_alloy",
    section: "Стали перлитного класса",
    label: "Легированные",
    groups: ["Сталь легированная"],
  },
  {
    id: "pearlitic_crmo",
    section: "Стали перлитного класса",
    label: "Легированные хромомолибденованадиевые",
    groups: ["Сталь легированная хромомолибденованадиевая"],
  },
  {
    id: "pearlitic_si_mn",
    section: "Стали перлитного класса",
    label: "Легированные кремнемарганцовистые",
    groups: ["Сталь легированная кремнемарганцовистая"],
  },
  {
    id: "high_chrome",
    section: "Стали высоколегированные",
    label: "Высокохромистые",
    groups: ["Сталь высокохромистая"],
  },
  {
    id: "austenitic",
    section: "Стали высоколегированные",
    label: "Хромоникелевые коррозионно-стойкие аустенитного класса",
    groups: ["Сталь хромоникелевая коррозионно-стойкого аустенитного класса"],
  },
  {
    id: "fe_ni",
    section: "Сплавы на железоникелевой основе",
    label: "Сплавы на железоникелевой основе",
    groups: ["Сплав на железоникелевой основе"],
  },
];

/** Разделы каталога марок (как в справочнике ПНАЭ) */
export const PNAE_CATALOG_LAYOUT: {
  majorTitle: string | null;
  categoryIds: string[];
  hideSubTitle?: boolean;
}[] = [
  {
    majorTitle: null,
    categoryIds: [
      "pearlitic_carbon",
      "pearlitic_alloy",
      "pearlitic_crmo",
      "pearlitic_si_mn",
    ],
  },
  {
    majorTitle: "СТАЛИ ВЫСОКОЛЕГИРОВАННЫЕ",
    categoryIds: ["high_chrome", "austenitic"],
  },
  {
    majorTitle: "СПЛАВЫ НА ЖЕЛЕЗОНИКЕЛЕВОЙ ОСНОВЕ",
    categoryIds: ["fe_ni"],
    hideSubTitle: true,
  },
];

/** Категории металла для справочника ГОСТ 34233.1 (стали ПНАЭ + титан) */
export const GOST_METAL_CATEGORIES: PnaeMetalCategory[] = [
  ...PNAE_METAL_CATEGORIES,
  {
    id: "titanium",
    section: "Цветные металлы и сплавы",
    label: "Титан и титановые сплавы",
    groups: ["Титан"],
  },
];

export function groupsFromGostCategoryId(categoryId: string): string[] {
  const cat = GOST_METAL_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.groups ?? [];
}

export function findGostCategoryIdForMark(handbook: SteelHandbook, mark: string): string | undefined {
  if (!mark) return undefined;
  for (const cat of GOST_METAL_CATEGORIES) {
    if (getMarksInGroups(handbook, cat.groups).includes(mark)) return cat.id;
  }
  return undefined;
}

export function getAllGostGroups(): string[] {
  const set = new Set<string>();
  for (const cat of GOST_METAL_CATEGORIES) {
    for (const g of cat.groups) set.add(g);
  }
  return [...set];
}

export function groupsFromCategoryIds(ids: string[]): string[] {
  const set = new Set<string>();
  for (const cat of PNAE_METAL_CATEGORIES) {
    if (ids.includes(cat.id)) {
      for (const g of cat.groups) set.add(g);
    }
  }
  return [...set];
}

/** Все группы сталей справочника ПНАЭ */
export function getAllPnaeGroups(): string[] {
  return groupsFromCategoryIds(PNAE_METAL_CATEGORIES.map((c) => c.id));
}

export function getAllMarks(handbook: SteelHandbook): string[] {
  return getMarksInGroups(handbook, getAllPnaeGroups());
}

function gradeInGroups(g: SteelGrade, groups: string[]): boolean {
  return groups.length === 0 || Boolean(g.group && groups.includes(g.group));
}

export function getMarksInGroups(handbook: SteelHandbook, groups: string[]): string[] {
  const set = new Set(
    handbook.grades.filter((g) => gradeInGroups(g, groups)).map((g) => displayMark(g))
  );
  return [...set].sort((a, b) => a.localeCompare(b, "ru"));
}

export interface MarkBrowseGroup {
  categoryId: string;
  section: string;
  label: string;
  marks: string[];
}

/** Марки для выбора, сгруппированные по типу металла (ПНАЭ) */
export function getMarkBrowseCatalog(
  handbook: SteelHandbook,
  filterGroups: string[] = [],
  query = ""
): MarkBrowseGroup[] {
  const q = query.trim().toLowerCase();
  return PNAE_METAL_CATEGORIES.filter(
    (cat) =>
      filterGroups.length === 0 ||
      cat.groups.some((g) => filterGroups.includes(g))
  )
    .map((cat) => ({
      categoryId: cat.id,
      section: cat.section,
      label: cat.label,
      marks: getMarksInGroups(handbook, cat.groups).filter(
        (m) => !q || m.toLowerCase().includes(q)
      ),
    }))
    .filter((g) => g.marks.length > 0);
}

export function getCategoryForGroup(group: string | null | undefined): PnaeMetalCategory | undefined {
  if (!group) return undefined;
  return PNAE_METAL_CATEGORIES.find((c) => c.groups.includes(group));
}

export function findCategoryIdForMark(handbook: SteelHandbook, mark: string): string | undefined {
  if (!mark) return undefined;
  for (const cat of PNAE_METAL_CATEGORIES) {
    if (getMarksInGroups(handbook, cat.groups).includes(mark)) return cat.id;
  }
  return undefined;
}

export function groupsFromCategoryId(categoryId: string): string[] {
  const cat = PNAE_METAL_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.groups ?? [];
}

export interface GradeSearchGroup {
  categoryId: string;
  section: string;
  label: string;
  grades: SteelGrade[];
}

/** Поиск записей справочника с группировкой по типу металла */
export function searchGradesGrouped(
  handbook: SteelHandbook,
  query: string,
  filterGroups: string[] = [],
  limitPerCategory = 20
): GradeSearchGroup[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  return PNAE_METAL_CATEGORIES.filter(
    (cat) =>
      filterGroups.length === 0 ||
      cat.groups.some((g) => filterGroups.includes(g))
  )
    .map((cat) => ({
      categoryId: cat.id,
      section: cat.section,
      label: cat.label,
      grades: handbook.grades
        .filter(
          (g) =>
            gradeInGroups(g, cat.groups) &&
            (g.name.toLowerCase().includes(q) || (g.mark?.toLowerCase().includes(q) ?? false))
        )
        .slice(0, limitPerCategory),
    }))
    .filter((g) => g.grades.length > 0);
}

export function getSortamentsInGroups(
  handbook: SteelHandbook,
  groups: string[],
  mark: string
): { sortament: string; group: string; gradeName: string }[] {
  return handbook.grades
    .filter((g) => gradeInGroups(g, groups) && displayMark(g) === mark)
    .map((g) => ({
      sortament: extractSortament(g.name),
      group: g.group ?? "",
      gradeName: g.name,
    }))
    .sort((a, b) => a.sortament.localeCompare(b.sortament, "ru"));
}

export function searchGrades(
  handbook: SteelHandbook,
  query: string,
  groups: string[] = [],
  limit = 24
): SteelGrade[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  return handbook.grades
    .filter(
      (g) =>
        gradeInGroups(g, groups) &&
        (g.name.toLowerCase().includes(q) || (g.mark?.toLowerCase().includes(q) ?? false))
    )
    .slice(0, limit);
}

export function findGradesByMark(
  handbook: SteelHandbook,
  mark: string,
  groups: string[] = []
): SteelGrade[] {
  return handbook.grades.filter(
    (g) => gradeInGroups(g, groups) && displayMark(g) === mark
  );
}

export function applyGradeToRow(grade: SteelGrade): {
  group: string;
  mark: string;
  sortament: string;
} {
  return {
    group: grade.group ?? "",
    mark: displayMark(grade),
    sortament: extractSortament(grade.name),
  };
}

export function findDemoGrade12X18N10T(handbook: SteelHandbook): SteelGrade | undefined {
  const needle = "Сортовой прокат и поковки из него";
  return handbook.grades.find(
    (g) =>
      g.mark === "12Х18Н10Т" &&
      g.name.includes(needle) &&
      g.name.includes("до 200")
  );
}

import {
  allowableStressModes,
  in1AllowableByMode,
  in1PressureSigma,
  in1ThresholdT,
  type AllowableStressMode,
} from "@intech-atom/in1";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export interface PnaeAllowableSnapshot {
  sigma: number;
  sigma13: number;
  sigmaRV: number;
}

export type PnaeAllowableMode = Exclude<
  AllowableStressMode,
  "stress_range_equipment" | "stress_range_piping" | "bolt_high_temp"
>;

export { in1ThresholdT };

export interface PnaeAllowableModeDef {
  id: PnaeAllowableMode;
  shortLabel: string;
  fullLabel: string;
}

/** Режимы расчёта [σ] по ПНАЭ Г-7-002-86 (краткие подписи — для таблицы) */
export const PNAE_ALLOWABLE_MODES: PnaeAllowableModeDef[] = [
  {
    id: "pressure_internal",
    shortLabel: "Внутреннее давление",
    fullLabel: "Оборудование и трубопроводы — внутреннее давление",
  },
  {
    id: "pressure_external",
    shortLabel: "Наружное давление",
    fullLabel: "Оборудование и трубопроводы — наружное давление больше внутреннего",
  },
  {
    id: "bolt",
    shortLabel: "Болты / шпильки",
    fullLabel: "Болты и шпильки от давления или усилий затяжка",
  },
  {
    id: "containment_shell",
    shortLabel: "Страховочные оболочки",
    fullLabel: "Корпуса страховочных и защитных оболочек",
  },
];

export const DEFAULT_PNAE_ALLOWABLE_MODES: PnaeAllowableMode[] = ["pressure_internal"];

/** Допускаемые напряжения при внутреннем давлении (ИН № 1, T ≤ Tt) */
export function computePnaeAllowable(
  rm: number,
  rp02: number,
  options: {
    temperature?: number;
    rmt?: number | null;
    materialGroup?: string | null;
    categoryId?: string | null;
  } = {}
): PnaeAllowableSnapshot | null {
  const p = in1PressureSigma({
    rm,
    rp02,
    rmt: options.rmt,
    temperature: options.temperature ?? 20,
    materialGroup: options.materialGroup,
    categoryId: options.categoryId,
    external: false,
  });
  if (!p) return null;
  return {
    sigma: round1(p.sigma),
    sigma13: round1(p.sigma13),
    sigmaRV: round1(p.stressRange),
  };
}

export interface PnaeAllowableByMode {
  sigma: number | null;
  sigma13: number | null;
  sigmaRV: number | null;
  applicable: boolean;
  conditionNote: string;
  incomplete?: boolean;
  tt: number;
}

export function computePnaeAllowableByMode(
  mode: PnaeAllowableMode,
  rm: number,
  rp02: number,
  options: {
    temperature?: number;
    boltThresholdT?: number;
    rmt?: number | null;
    materialGroup?: string | null;
    categoryId?: string | null;
  } = {}
): PnaeAllowableByMode | null {
  const result = in1AllowableByMode({
    mode,
    rm,
    rp02,
    rmt: options.rmt,
    temperature: options.temperature,
    tt: options.boltThresholdT,
    materialGroup: options.materialGroup,
    categoryId: options.categoryId,
  });
  if (!result) return null;

  return {
    sigma: result.sigma != null ? round1(result.sigma) : null,
    sigma13: result.sigma13 != null ? round1(result.sigma13) : null,
    sigmaRV: result.sigmaRV != null ? round1(result.sigmaRV) : null,
    applicable: result.applicable,
    conditionNote: result.conditionNote,
    incomplete: result.incomplete,
    tt: result.tt,
  };
}

/** Все режимы ИН № 1 (включая размах напряжений) */
export const IN1_ALLOWABLE_MODES = allowableStressModes;

export const MECH_PROPS: SteelPropertyKey[] = [
  "rm",
  "rp02",
  "elongationA",
  "reductionZ",
  "thermalExpansionAlpha",
  "elasticModulusE",
];
