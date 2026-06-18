import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SteelHandbook } from "@/types/steel";
import {
  applyGradeToRow,
  extractSortament,
  findCategoryIdForMark,
  findGradesByMark,
} from "@/lib/steelHandbook";
import {
  PnaeSteelWorktable,
  buildEmptyRow,
  type PnaeTableRow,
} from "@/components/handbooks/PnaeSteelWorktable";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { loadHandbookData } from "@/lib/handbookDataLoader";
import { newRowId } from "@/lib/utils";

function rowFromUrl(handbook: SteelHandbook, params: URLSearchParams): PnaeTableRow | null {
  const mat = params.get("mat")?.trim();
  if (!mat) return null;

  const grades = findGradesByMark(handbook, mat);
  if (grades.length === 0) return null;

  const sortParam = params.get("sortament")?.trim();
  const grade =
    (sortParam &&
      grades.find((g) => extractSortament(g.name) === sortParam || g.name.includes(sortParam))) ||
    grades.find((g) => g.name.includes("Сортовой прокат") && g.name.includes("200")) ||
    grades[0];

  const t = Number(params.get("t"));
  const applied = applyGradeToRow(grade);
  return {
    id: newRowId(),
    categoryId: findCategoryIdForMark(handbook, applied.mark) ?? "",
    ...applied,
    temperature: Number.isFinite(t) ? t : 20,
  };
}

export function SteelPropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<SteelHandbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExtraProps, setShowExtraProps] = useState(searchParams.get("extra") === "1");
  const [rows, setRows] = useState<PnaeTableRow[]>([]);

  useEffect(() => {
    loadHandbookData()
      .then((d) => {
        setData(d);
        setRows([rowFromUrl(d, searchParams) ?? buildEmptyRow()]);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init from URL once
  }, []);

  useEffect(() => {
    if (!loading && data && rows.length === 0) {
      setRows([buildEmptyRow()]);
    }
  }, [loading, data, rows.length]);

  const syncUrl = useCallback(
    (nextRows: PnaeTableRow[], extra: boolean) => {
      const primary = nextRows[0];
      if (!primary?.mark) {
        if (searchParams.toString()) setSearchParams({}, { replace: true });
        return;
      }
      const p = new URLSearchParams();
      p.set("mat", primary.mark);
      if (primary.sortament) p.set("sortament", primary.sortament);
      p.set("t", String(primary.temperature));
      if (nextRows.length > 1) p.set("rows", String(nextRows.length));
      if (extra) p.set("extra", "1");
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (!data || loading) return;
    syncUrl(rows, showExtraProps);
  }, [rows, showExtraProps, data, loading, syncUrl]);

  const onRowChange = useCallback((id: string, patch: Partial<PnaeTableRow>) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const onAddRow = useCallback(() => {
    setRows((list) => [
      ...list,
      {
        id: newRowId(),
        categoryId: "",
        group: "",
        mark: "",
        sortament: "",
        temperature: list[0]?.temperature ?? 20,
      },
    ]);
  }, []);

  const onDuplicateRow = useCallback((id: string) => {
    const newId = newRowId();
    setRows((list) => {
      const src = list.find((r) => r.id === id);
      if (!src) return list;
      const copy: PnaeTableRow = { ...src, id: newId };
      const idx = list.findIndex((r) => r.id === id);
      const next = [...list];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    return newId;
  }, []);

  const onRemoveRow = useCallback((id: string) => {
    setRows((list) => (list.length <= 1 ? list : list.filter((r) => r.id !== id)));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-[var(--color-destructive)]">Не удалось загрузить справочник</p>;
  }

  return (
    <div className="min-w-0 space-y-10">
      <div className="relative min-w-0 max-w-full rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] sm:p-10">
        <ThemeToggle className="absolute top-4 right-4 sm:top-6 sm:right-6" />
        <div className="pr-12">
        <p className="text-sm font-normal text-[var(--color-muted-foreground)] sm:text-base">
          Физико-механические свойства сталей
        </p>
        <h1 className="mt-0.5 font-sans text-2xl font-bold uppercase leading-tight tracking-wide text-[var(--color-heading)] sm:text-3xl">
          ПНАЭ Г-7-002-86
        </h1>
        <p className="mt-3 w-full text-lg font-semibold leading-snug text-[var(--color-heading)]">
          Предел текучести, предел прочности, допускаемые напряжения, модуль упругости и коэффициент
          линейного расширения
        </p>
        <p className="mt-2 w-full text-base leading-snug text-[var(--color-muted-foreground)]">
          Можно добавить несколько строк: разные марки или одну марку при разных температурах
        </p>
        </div>
      </div>

      <PnaeSteelWorktable
        handbook={data}
        rows={rows}
        onRowChange={onRowChange}
        onAddRow={onAddRow}
        onDuplicateRow={onDuplicateRow}
        onRemoveRow={onRemoveRow}
        showExtraProps={showExtraProps}
        onShowExtraPropsChange={setShowExtraProps}
      />
    </div>
  );
}
