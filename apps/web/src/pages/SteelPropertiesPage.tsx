import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
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
    fetch("/data/pnae-steel-properties.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<SteelHandbook>;
      })
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-muted-foreground)]">ПНАЭ Г-7-002-86</p>
            <h1 className="mt-0.5 text-2xl font-bold uppercase leading-tight tracking-wide text-[var(--color-heading)]">
              Справочник свойств сталей
            </h1>
            <p className="mt-1 max-w-3xl text-base leading-snug text-[var(--color-muted-foreground)]">
              Каталог марок по классификации ПНАЭ — выберите марку, сортамент и температуру.
            </p>
            <p className="mt-1 max-w-3xl text-base leading-snug text-[var(--color-muted-foreground)]">
              Можно добавить несколько строк: разные марки или одну марку при разных температурах.
            </p>
          </div>
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
