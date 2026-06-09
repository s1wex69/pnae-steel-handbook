import { useEffect, useMemo, useState } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import type { SteelGrade, SteelHandbook } from "@/types/steel";
import {
  PNAE_METAL_CATEGORIES,
  displayMark,
  extractSortament,
  getMarkBrowseCatalog,
  getSortamentsInGroups,
  searchGradesGrouped,
} from "@/lib/steelHandbook";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  handbook: SteelHandbook;
  filterGroups: string[];
  open: boolean;
  onClose: () => void;
  onPick: (grade: SteelGrade) => void;
}

export function GradePickerModal({ handbook, filterGroups, open, onClose, onPick }: Props) {
  const [q, setQ] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [expandedMark, setExpandedMark] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      setActiveCategoryId("all");
      setExpandedMark(null);
    }
  }, [open]);

  const searching = q.trim().length > 0;

  const searchResults = useMemo(
    () => (searching ? searchGradesGrouped(handbook, q, filterGroups) : []),
    [handbook, q, filterGroups, searching]
  );

  const catalog = useMemo(
    () => getMarkBrowseCatalog(handbook, filterGroups, ""),
    [handbook, filterGroups]
  );

  const sidebar = useMemo(() => {
    const cats = PNAE_METAL_CATEGORIES.filter(
      (cat) =>
        filterGroups.length === 0 ||
        cat.groups.some((g) => filterGroups.includes(g))
    );
    return [
      { id: "all", label: "Все типы", section: "" },
      ...cats.map((c) => ({ id: c.id, label: c.label, section: c.section })),
    ];
  }, [filterGroups]);

  const browseGroups = useMemo(
    () =>
      activeCategoryId === "all"
        ? catalog
        : catalog.filter((g) => g.categoryId === activeCategoryId),
    [catalog, activeCategoryId]
  );

  const sortamentGroups = useMemo(() => {
    if (activeCategoryId !== "all") {
      return PNAE_METAL_CATEGORIES.find((c) => c.id === activeCategoryId)?.groups ?? filterGroups;
    }
    return filterGroups;
  }, [activeCategoryId, filterGroups]);

  const sortaments = useMemo(() => {
    if (!expandedMark) return [];
    return getSortamentsInGroups(handbook, sortamentGroups, expandedMark);
  }, [handbook, sortamentGroups, expandedMark]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[6vh]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div>
            <h3 className="font-semibold">Справочник марок стали</h3>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              По типу металла или поиск по марке и сортаменту
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-[var(--color-muted)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative border-b border-[var(--color-border)] px-4 py-3">
          <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            className="h-11 pl-9"
            placeholder="Поиск: 12Х18Н10Т, 09Г2С, сортовой прокат…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setExpandedMark(null);
            }}
            autoFocus
          />
        </div>

        <div className="flex min-h-0 flex-1">
          {!searching && (
            <aside className="w-44 shrink-0 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 p-2 sm:w-52">
              {sidebar.map((item, i) => {
                const showSection =
                  item.section && (i === 0 || sidebar[i - 1].section !== item.section);
                return (
                  <div key={item.id}>
                    {showSection && item.id !== "all" && (
                      <p className="mb-1 mt-2 px-2 text-[9px] font-semibold uppercase tracking-wide text-[var(--color-primary)] first:mt-0">
                        {item.section}
                      </p>
                    )}
                    <button
                      type="button"
                      className={cn(
                        "mb-0.5 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs transition-colors",
                        activeCategoryId === item.id
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "hover:bg-[var(--color-accent)]"
                      )}
                      onClick={() => {
                        setActiveCategoryId(item.id);
                        setExpandedMark(null);
                      }}
                    >
                      <span>{item.label}</span>
                      {activeCategoryId === item.id && <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                );
              })}
            </aside>
          )}

          <div className="min-w-0 flex-1 overflow-y-auto p-4">
            {searching ? (
              searchResults.length === 0 ? (
                <p className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
                  Ничего не найдено
                </p>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((group) => (
                    <div key={group.categoryId}>
                      <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
                        {group.section} · {group.label}
                      </p>
                      <ul className="space-y-1">
                        {group.grades.map((g) => (
                          <li key={g.name}>
                            <button
                              type="button"
                              className="w-full rounded-lg border border-transparent px-3 py-2.5 text-left hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-accent)]"
                              onClick={() => {
                                onPick(g);
                                onClose();
                              }}
                            >
                              <span className="font-semibold text-[var(--color-primary)]">
                                {displayMark(g)}
                              </span>
                              <span className="mt-0.5 block text-xs leading-snug text-[var(--color-muted-foreground)]">
                                {extractSortament(g.name)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            ) : browseGroups.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
                Нет марок в этой категории
              </p>
            ) : (
              <div className="space-y-6">
                {browseGroups.map((group) => (
                  <div key={group.categoryId}>
                    {activeCategoryId === "all" && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                        {group.section}
                      </p>
                    )}
                    <p className="mb-2 text-sm font-medium">{group.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.marks.map((mark) => (
                        <button
                          key={mark}
                          type="button"
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                            expandedMark === mark
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                              : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-accent)]"
                          )}
                          onClick={() => setExpandedMark((m) => (m === mark ? null : mark))}
                        >
                          {mark}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {expandedMark && (
                  <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/[0.04] p-4">
                    <p className="text-sm font-semibold text-[var(--color-primary)]">
                      {expandedMark} — выберите сортамент
                    </p>
                    <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">
                      {sortaments.map((s) => {
                        const grade = handbook.grades.find((g) => g.name === s.gradeName);
                        if (!grade) return null;
                        return (
                          <li key={s.gradeName}>
                            <button
                              type="button"
                              className="w-full rounded-lg px-3 py-2 text-left text-xs leading-snug hover:bg-[var(--color-card)]"
                              onClick={() => {
                                onPick(grade);
                                onClose();
                              }}
                            >
                              {s.sortament}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
