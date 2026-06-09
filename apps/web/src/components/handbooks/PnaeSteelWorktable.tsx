import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import type { SteelHandbook, SteelPropertyKey } from "@/types/steel";
import {
  computePnaeAllowable,
  computePnaeAllowableByMode,
  DEFAULT_PNAE_ALLOWABLE_MODES,
  findCategoryIdForMark,
  findGrade,
  getAllPnaeGroups,
  getSortamentsInGroups,
  groupsFromCategoryId,
  interpolatedValue,
  MECH_PROPS,
  PNAE_ALLOWABLE_MODES,
  type PnaeAllowableMode,
} from "@/lib/steelHandbook";
import { In1Symbol, in1SymbolIdForMode } from "@/components/handbooks/In1Symbol";
import { MechPropertyHeader, TemperatureHeader } from "@/components/handbooks/MathNotation";
import { PnaeSteelLegend } from "@/components/handbooks/PnaeSteelLegend";
import { SteelMarkCatalog } from "@/components/handbooks/SteelMarkCatalog";
import { StyledSelect } from "@/components/handbooks/SelectStep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, newRowId } from "@/lib/utils";

export interface PnaeTableRow {
  id: string;
  categoryId: string;
  group: string;
  mark: string;
  sortament: string;
  temperature: number;
}

interface Props {
  handbook: SteelHandbook;
  rows: PnaeTableRow[];
  onRowChange: (id: string, patch: Partial<PnaeTableRow>) => void;
  onAddRow: () => void;
  onDuplicateRow: (id: string) => string;
  onRemoveRow: (id: string) => void;
  showExtraProps: boolean;
  onShowExtraPropsChange: (v: boolean) => void;
}

function rowTabLabel(row: PnaeTableRow, index: number): string {
  const base = row.mark || `Материал ${index + 1}`;
  if (row.mark) return `${base} · ${row.temperature}°`;
  return base;
}

function fmt(n: number | null, digits = 1): string {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

const MECH_CORE: { key: SteelPropertyKey; short: string }[] = [
  { key: "rp02", short: "Rp0,2" },
  { key: "rm", short: "Rm" },
  { key: "elasticModulusE", short: "E" },
  { key: "thermalExpansionAlpha", short: "α" },
];

const MECH_EXTRA: { key: SteelPropertyKey; short: string }[] = [
  { key: "elongationA", short: "α" },
  { key: "reductionZ", short: "Z" },
];

type RowCalc = {
  row: PnaeTableRow;
  grade: ReturnType<typeof findGrade>;
  mech: Record<SteelPropertyKey, number | null>;
  allowable: ReturnType<typeof computePnaeAllowable> | null;
  ready: boolean;
};

function useRowCalcs(handbook: SteelHandbook, rows: PnaeTableRow[]): RowCalc[] {
  return useMemo(
    () =>
      rows.map((row) => {
        const grade =
          row.group && row.mark && row.sortament
            ? findGrade(handbook, row.group, row.mark, row.sortament)
            : undefined;
        const t = row.temperature;
        const tempValid = Number.isFinite(t);
        const mech = Object.fromEntries(
          MECH_PROPS.map((key) => [
            key,
            grade && tempValid ? interpolatedValue(grade, key, t) : null,
          ])
        ) as Record<SteelPropertyKey, number | null>;
        const rm = mech.rm;
        const rp02 = mech.rp02;
        const allowable =
          tempValid &&
          rm !== null &&
          rp02 !== null &&
          rm > 0 &&
          rp02 > 0 &&
          rp02 <= rm
            ? computePnaeAllowable(rm, rp02, {
                temperature: t,
                materialGroup: grade?.group,
                categoryId: row.categoryId,
              })
            : null;
        return {
          row,
          grade,
          mech,
          allowable,
          ready: Boolean(grade && row.mark && row.sortament && tempValid),
        };
      }),
    [handbook, rows]
  );
}

function MarkCell({
  mark,
  sortament,
  prominent = false,
}: {
  mark: string;
  sortament: string;
  prominent?: boolean;
}) {
  return (
    <div>
      <div
        className={cn(
          "font-semibold text-[var(--color-heading)]",
          prominent && "text-lg tracking-wide"
        )}
      >
        {mark}
      </div>
      <div
        className={cn(
          "mt-1 leading-snug text-[var(--color-muted-foreground)]",
          prominent ? "text-sm" : "text-xs"
        )}
      >
        {sortament}
      </div>
    </div>
  );
}

function TemperatureInput({
  rowId,
  value,
  disabled,
  onChange,
}: {
  rowId: string;
  value: number;
  disabled: boolean;
  onChange: (temperature: number) => void;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [rowId, value]);

  return (
    <Input
      id={`temp-${rowId}`}
      type="text"
      inputMode="decimal"
      className="h-11 max-w-[160px] tabular-nums"
      value={text}
      disabled={disabled}
      placeholder="°C"
      onChange={(e) => {
        const raw = e.target.value.replace(",", ".");
        setText(raw);
        if (raw.trim() === "" || raw === "-" || raw === ".") return;
        const n = Number(raw);
        if (Number.isFinite(n)) onChange(n);
      }}
      onBlur={() => {
        const raw = text.trim().replace(",", ".");
        if (raw === "" || raw === "-" || raw === ".") {
          setText(String(value));
          return;
        }
        const n = Number(raw);
        if (Number.isFinite(n)) {
          onChange(n);
          setText(String(n));
        } else {
          setText(String(value));
        }
      }}
    />
  );
}

function SortamentAndTemp({
  handbook,
  row,
  onChange,
}: {
  handbook: SteelHandbook;
  row: PnaeTableRow;
  onChange: (patch: Partial<PnaeTableRow>) => void;
}) {
  const filterGroups = row.categoryId
    ? groupsFromCategoryId(row.categoryId)
    : getAllPnaeGroups();
  const sortOpts = row.mark ? getSortamentsInGroups(handbook, filterGroups, row.mark) : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Сортамент</Label>
        <StyledSelect
          hasValue={!!row.sortament}
          placeholder={row.mark ? "Выберите сортамент" : "Сначала выберите марку"}
          value={row.sortament}
          disabled={!row.mark}
          onChange={(e) => {
            const sortament = e.target.value;
            const match = sortOpts.find((s) => s.sortament === sortament);
            onChange({ sortament, group: match?.group ?? row.group });
          }}
        >
          {sortOpts.map((s) => (
            <option key={s.gradeName} value={s.sortament}>
              {s.sortament}
            </option>
          ))}
        </StyledSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`temp-${row.id}`}>Расчётная температура стенки, °C</Label>
        <TemperatureInput
          rowId={row.id}
          value={row.temperature}
          disabled={!row.sortament}
          onChange={(temperature) => onChange({ temperature })}
        />
      </div>
    </div>
  );
}

function toggleAllowableMode(
  modes: PnaeAllowableMode[],
  mode: PnaeAllowableMode,
  checked: boolean
): PnaeAllowableMode[] {
  if (checked) return modes.includes(mode) ? modes : [...modes, mode];
  const next = modes.filter((m) => m !== mode);
  return next.length > 0 ? next : DEFAULT_PNAE_ALLOWABLE_MODES;
}

function ResultsBlock({
  handbook,
  calcs,
  showExtraProps,
  onShowExtraPropsChange,
  allowableModes,
  onAllowableModesChange,
}: {
  handbook: SteelHandbook;
  calcs: RowCalc[];
  showExtraProps: boolean;
  onShowExtraPropsChange: (v: boolean) => void;
  allowableModes: PnaeAllowableMode[];
  onAllowableModesChange: (modes: PnaeAllowableMode[]) => void;
}) {
  const ready = calcs.filter((c) => c.ready);
  if (ready.length === 0) return null;

  const mechCols = [...MECH_CORE, ...(showExtraProps ? MECH_EXTRA : [])];

  const allowableRows = ready.flatMap((calc) => {
    const rm = calc.mech.rm;
    const rp02 = calc.mech.rp02;
    if (rm == null || rp02 == null) return [];

    return allowableModes.flatMap((mode) => {
      const def = PNAE_ALLOWABLE_MODES.find((m) => m.id === mode);
      const result = computePnaeAllowableByMode(mode, rm, rp02, {
        temperature: calc.row.temperature,
        materialGroup: calc.grade?.group,
        categoryId: calc.row.categoryId,
      });
      if (!def || !result) return [];
      return [{ calc, mode, def, result }];
    });
  });

  const colLabel = (key: SteelPropertyKey) => {
    const unit = handbook.properties[key]?.unit ?? "";
    return <MechPropertyHeader propertyKey={key} unit={unit} atTemperature />;
  };

  const tableHead =
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-semibold";
  const tableWrap =
    "overflow-x-auto rounded-xl border-2 border-[var(--color-primary)]/25 bg-[var(--color-card)] shadow-[var(--shadow-card)]";
  const thCell =
    "border-r border-[var(--color-primary-foreground)]/12 px-4 py-4 text-center align-middle last:border-r-0";
  const tdCell =
    "border-r border-[var(--color-border)]/35 px-4 py-4 text-center align-middle last:border-r-0";
  const valueCell = cn(
    tdCell,
    "text-lg font-bold tabular-nums text-[var(--color-heading)]"
  );
  const tempBadge =
    "inline-flex min-w-[3rem] items-center justify-center rounded-md bg-[var(--color-primary)]/12 px-2.5 py-1 text-base font-bold tabular-nums text-[var(--color-heading)]";

  return (
    <Card className="border-2 border-[var(--color-primary)]/35 shadow-[var(--shadow-card)]">
      <CardContent className="space-y-10 p-6 sm:p-8">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-l-4 border-[var(--color-primary)] pl-4">
            <h2 className="text-xl font-bold text-[var(--color-heading)] sm:text-2xl">
              Физико-механические характеристики сталей
              <span className="mt-1 block text-sm font-normal text-[var(--color-muted-foreground)]">
                ПНАЭ Г-7-002-86
              </span>
            </h2>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/60 px-3 py-2 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-primary)]"
                checked={showExtraProps}
                onChange={(e) => onShowExtraPropsChange(e.target.checked)}
              />
              Показать α и Z
            </label>
          </div>
          <div className={cn(tableWrap, "mt-5")}>
            <table className="w-full border-collapse">
              <thead>
                <tr className={tableHead}>
                  <th className={cn(thCell, "px-5 whitespace-nowrap")}>Марка стали</th>
                  <th className={cn(thCell, "whitespace-nowrap")}>
                    <TemperatureHeader />
                  </th>
                  {mechCols.map((c) => (
                    <th key={c.key} className={cn(thCell, "whitespace-nowrap")}>
                      {colLabel(c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ready.map(({ row, mech }, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-[var(--color-border)]/60",
                      i % 2 === 1 && "bg-[var(--color-muted)]/50"
                    )}
                  >
                    <td className={cn(tdCell, "px-5")}>
                      <div className="flex flex-col items-center text-center">
                        <MarkCell mark={row.mark} sortament={row.sortament} prominent />
                      </div>
                    </td>
                    <td className={tdCell}>
                      <span className={tempBadge}>{row.temperature}</span>
                    </td>
                    {mechCols.map((c) => (
                      <td key={c.key} className={valueCell}>
                        {fmt(mech[c.key], c.key === "elasticModulusE" ? 0 : 1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="border-l-4 border-[var(--color-primary)] pl-4">
            <h2 className="text-xl font-bold text-[var(--color-heading)] sm:text-2xl">
              Допускаемые напряжения
              <span className="mt-1 block text-sm font-normal text-[var(--color-muted-foreground)]">
                ПНАЭ Г-7-002-86
              </span>
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {PNAE_ALLOWABLE_MODES.map((mode) => (
                <label
                  key={mode.id}
                  title={mode.fullLabel}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm text-[var(--color-foreground)]"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-primary)]"
                    checked={allowableModes.includes(mode.id)}
                    onChange={(e) =>
                      onAllowableModesChange(
                        toggleAllowableMode(allowableModes, mode.id, e.target.checked)
                      )
                    }
                  />
                  {mode.shortLabel}
                </label>
              ))}
            </div>
          </div>
          <div className={cn(tableWrap, "mt-5 ring-2 ring-[var(--color-primary)]/15")}>
            <table className="w-full border-collapse">
              <thead>
                <tr className={tableHead}>
                  <th className={cn(thCell, "px-5 whitespace-nowrap")}>Марка стали</th>
                  <th className={cn(thCell, "whitespace-nowrap")}>Условие</th>
                  <th className={cn(thCell, "whitespace-nowrap")}>
                    <TemperatureHeader />
                  </th>
                  <th className={cn(thCell, "whitespace-nowrap")}>
                    <In1Symbol id="sigma" />, МПа
                  </th>
                  <th className={cn(thCell, "whitespace-nowrap")}>
                    <In1Symbol id="sigma13" />, МПа
                  </th>
                  <th className={cn(thCell, "whitespace-nowrap")}>
                    <In1Symbol id="sigma_rv" />, МПа
                  </th>
                </tr>
              </thead>
              <tbody>
                {allowableRows.length === 0 ? (
                  <tr className="border-t border-[var(--color-border)]/60">
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                    >
                      Нет данных для выбранных условий расчёта
                    </td>
                  </tr>
                ) : (
                  allowableRows.map(({ calc, def, result }, i) => (
                    <tr
                      key={`${calc.row.id}-${def.id}`}
                      className={cn(
                        "border-t border-[var(--color-border)]/60",
                        i % 2 === 1 && "bg-[var(--color-muted)]/50"
                      )}
                    >
                      <td className={cn(tdCell, "px-5")}>
                        <div className="flex flex-col items-center text-center">
                          <MarkCell mark={calc.row.mark} sortament={calc.row.sortament} prominent />
                        </div>
                      </td>
                      <td
                        className={cn(tdCell, "text-sm font-medium text-[var(--color-foreground)]")}
                        title={def.fullLabel}
                      >
                        {def.shortLabel}
                      </td>
                      <td className={tdCell}>
                        <span className={tempBadge}>{calc.row.temperature}</span>
                      </td>
                      <td
                        className={tdCell}
                        title={
                          result.incomplete ? "При T > Tt не задан R_mt — значение может быть завышено" : undefined
                        }
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <In1Symbol
                            id={in1SymbolIdForMode(def.id)}
                            className="text-sm font-semibold text-[var(--color-muted-foreground)]"
                          />
                          <span className="text-xl font-bold tabular-nums text-[var(--color-emphasis)]">
                            {result.applicable ? fmt(result.sigma) : "—"}
                            {result.incomplete ? (
                              <span className="ml-1 text-sm text-amber-600">⚠</span>
                            ) : null}
                          </span>
                        </div>
                      </td>
                      <td className={valueCell}>
                        {result.sigma13 != null ? fmt(result.sigma13) : "—"}
                      </td>
                      <td className={valueCell}>
                        {result.sigmaRV != null ? fmt(result.sigmaRV) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

export function PnaeSteelWorktable({
  handbook,
  rows,
  onRowChange,
  onAddRow,
  onDuplicateRow,
  onRemoveRow,
  showExtraProps,
  onShowExtraPropsChange,
}: Props) {
  const [activeRowId, setActiveRowId] = useState(() => rows[0]?.id ?? "");
  const [allowableModes, setAllowableModes] = useState<PnaeAllowableMode[]>(
    DEFAULT_PNAE_ALLOWABLE_MODES
  );
  useEffect(() => {
    if (!rows.some((r) => r.id === activeRowId)) {
      setActiveRowId(rows[0]?.id ?? "");
    }
  }, [rows, activeRowId]);

  const activeRow = rows.find((r) => r.id === activeRowId) ?? rows[0];
  const calcs = useRowCalcs(handbook, rows);
  const hasResults = calcs.some((c) => c.ready);

  const selectCategory = useCallback(
    (categoryId: string) => {
      if (!activeRow) return;
      onRowChange(activeRow.id, { categoryId });
    },
    [activeRow, onRowChange]
  );

  const selectMark = useCallback(
    (mark: string) => {
      if (!activeRow) return;
      const categoryId = mark
        ? (findCategoryIdForMark(handbook, mark) ?? activeRow.categoryId)
        : activeRow.categoryId;
      const groups = categoryId
        ? groupsFromCategoryId(categoryId)
        : getAllPnaeGroups();
      const opts = getSortamentsInGroups(handbook, groups, mark);
      const exact = opts.find((o) => o.sortament === activeRow.sortament);
      const first = exact ?? opts[0];
      onRowChange(activeRow.id, {
        mark,
        categoryId,
        group: first?.group ?? "",
        sortament: first?.sortament ?? "",
      });
    },
    [activeRow, handbook, onRowChange]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[var(--color-heading)]">
            Предел текучести, предел прочности, допускаемые напряжения, модуль упругости и коэффициент
            линейного расширения
          </CardTitle>
          <CardDescription>
            Выберите материал, марку, сортамент и температуру. Несколько строк — для разных марок или
            одной марки при разных температурах.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Материал:</span>
            {rows.map((row, i) => (
              <button
                key={row.id}
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  activeRowId === row.id
                    ? "border-[var(--color-emphasis)] bg-[var(--color-primary)]/20 text-[var(--color-emphasis)]"
                    : "border-[var(--color-border)] hover:bg-[var(--color-accent)]"
                )}
                onClick={() => setActiveRowId(row.id)}
              >
                {rowTabLabel(row, i)}
                {rows.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="rounded p-0.5 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRow(row.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveRow(row.id);
                      }
                    }}
                    aria-label="Удалить строку"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={onAddRow} title="Добавить материал">
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
            {activeRow?.mark && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newId = onDuplicateRow(activeRow.id);
                  setActiveRowId(newId);
                }}
                title="Та же марка и сортамент, другая температура"
              >
                <Copy className="h-4 w-4" />
                Та же марка
              </Button>
            )}
          </div>

          <SteelMarkCatalog
            handbook={handbook}
            categoryId={activeRow?.categoryId ?? ""}
            selectedMark={activeRow?.mark ?? ""}
            onCategoryChange={selectCategory}
            onSelectMark={selectMark}
            middleSlot={
              activeRow ? (
                <SortamentAndTemp
                  handbook={handbook}
                  row={activeRow}
                  onChange={(patch) => onRowChange(activeRow.id, patch)}
                />
              ) : null
            }
          />
        </CardContent>
      </Card>

      {hasResults ? (
        <ResultsBlock
          handbook={handbook}
          calcs={calcs}
          showExtraProps={showExtraProps}
          onShowExtraPropsChange={onShowExtraPropsChange}
          allowableModes={allowableModes}
          onAllowableModesChange={setAllowableModes}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center text-sm text-[var(--color-muted-foreground)]">
          Выберите марку, сортамент и температуру — результаты появятся здесь автоматически
        </div>
      )}

      <PnaeSteelLegend />
    </div>
  );
}

export function buildEmptyRow(): PnaeTableRow {
  return {
    id: newRowId(),
    categoryId: "",
    group: "",
    mark: "",
    sortament: "",
    temperature: 20,
  };
}
