import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SteelHandbook } from "@/types/steel";
import { displayMark } from "@/lib/steelHandbook";
import { StyledSelect } from "@/components/handbooks/SelectStep";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  handbook: SteelHandbook;
  categoryId: string;
  selectedMark: string;
  onCategoryChange: (categoryId: string) => void;
  onSelectMark: (mark: string) => void;
  /** Блок после выбора марки (сортамент, температура) */
  afterMarkSlot?: ReactNode;
  className?: string;
}

function uniqueSorted(list: string[]): string[] {
  return [...new Set(list)].sort((a, b) => a.localeCompare(b, "ru"));
}

function getGostGroups(handbook: SteelHandbook): string[] {
  return uniqueSorted(handbook.grades.map((g) => g.group ?? "").filter(Boolean));
}

function getMarksInGroups(handbook: SteelHandbook, groups: string[]): string[] {
  const marks = handbook.grades
    .filter((g) => g.group && groups.includes(g.group))
    .map((g) => displayMark(g))
    .filter(Boolean);
  return uniqueSorted(marks);
}

export function GostSteelMarkCatalog({
  handbook,
  categoryId,
  selectedMark,
  onCategoryChange,
  onSelectMark,
  afterMarkSlot,
  className,
}: Props) {
  const gostGroups = useMemo(() => getGostGroups(handbook), [handbook]);

  const [markFilter, setMarkFilter] = useState("");
  const [marksListOpen, setMarksListOpen] = useState(() => !selectedMark);

  useEffect(() => {
    if (selectedMark) setMarksListOpen(false);
  }, [selectedMark]);

  useEffect(() => {
    setMarkFilter(selectedMark);
  }, [selectedMark]);

  const scopeGroups = categoryId ? [categoryId] : gostGroups;

  const allMarks = useMemo(() => getMarksInGroups(handbook, scopeGroups), [handbook, scopeGroups]);

  const isSearching =
    markFilter.trim().length > 0 && markFilter.trim().toLowerCase() !== selectedMark.trim().toLowerCase();

  const marks = useMemo(() => {
    const q = markFilter.trim().toLowerCase();
    if (!isSearching) return allMarks;
    return allMarks.filter((m) => m.toLowerCase().includes(q));
  }, [allMarks, isSearching, markFilter]);

  const listVisible = marksListOpen || isSearching;

  const pickMark = (mark: string) => {
    onSelectMark(mark);
    setMarkFilter(mark);
    setMarksListOpen(false);
  };

  const onCategorySelect = (nextCategoryId: string) => {
    onCategoryChange(nextCategoryId);
    if (nextCategoryId) setMarksListOpen(true);

    // Если выбранная марка не существует в категории — очистим марку.
    if (selectedMark) {
      const nextGroups = nextCategoryId ? [nextCategoryId] : gostGroups;
      const allowed = getMarksInGroups(handbook, nextGroups).includes(selectedMark);
      if (!allowed) onSelectMark("");
    }
  };

  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      <div className="space-y-2">
        <Label htmlFor="gost-category">Категория</Label>
        <StyledSelect
          hasValue={!!categoryId}
          id="gost-category"
          placeholder="Все категории"
          value={categoryId}
          onChange={(e) => onCategorySelect(e.target.value)}
        >
          <option value="">Все категории</option>
          {gostGroups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </StyledSelect>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="gost-mark-filter">
            Марка
            <span className="ml-1 text-xs font-normal text-[var(--color-muted-foreground)]">
              {categoryId ? `· ${categoryId}` : "· все марки"}
            </span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-[var(--color-muted-foreground)]"
            onClick={() => setMarksListOpen((open) => !open)}
            aria-expanded={listVisible}
          >
            {listVisible ? (
              <>
                Скрыть список
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Показать список
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        <Input
          id="gost-mark-filter"
          className="h-9"
          placeholder="Начните вводить марку…"
          value={markFilter}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const value = e.target.value;
            setMarkFilter(value);
            if (value.trim()) {
              setMarksListOpen(true);
              if (selectedMark && value !== selectedMark) onSelectMark("");
            } else if (selectedMark) {
              onSelectMark("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const q = markFilter.trim().toLowerCase();
            if (!q) return;
            const exact = marks.find((m) => m.toLowerCase() === q);
            if (exact) {
              pickMark(exact);
              return;
            }
            if (marks.length === 1) pickMark(marks[0]);
          }}
        />

        {!listVisible && !selectedMark ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {categoryId ? `Список марок скрыт для категории.` : "Список марок скрыт."}
          </p>
        ) : !listVisible ? null : (
          <div
            className={cn(
              "min-h-80 min-w-0 max-h-[32rem] overflow-x-hidden overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3",
              marks.length === 0 && "flex items-center justify-center py-16 text-base text-[var(--color-muted-foreground)]"
            )}
          >
            {marks.length === 0 ? (
              markFilter.trim() ? (
                "Марка не найдена"
              ) : (
                "Нет марок"
              )
            ) : (
              <ul className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-3">
                {marks.map((mark) => (
                  <li key={mark} className="min-w-0">
                    <button
                      type="button"
                      className={cn(
                        "w-full min-w-0 truncate rounded-lg px-3 py-2.5 text-left text-sm font-medium leading-snug transition-colors sm:text-base",
                        mark === selectedMark
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                          : "text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)]"
                      )}
                      title={mark}
                      onClick={() => pickMark(mark)}
                    >
                      {mark}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {afterMarkSlot}
    </div>
  );
}

