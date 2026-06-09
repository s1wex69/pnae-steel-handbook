import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { SteelHandbook } from "@/types/steel";
import { getMarkBrowseCatalog } from "@/lib/steelHandbook";
import { cn } from "@/lib/utils";

type FlatItem = { mark: string; categoryId: string; label: string; section: string };

function flattenCatalog(
  catalog: ReturnType<typeof getMarkBrowseCatalog>,
  activeCategoryId: string
): FlatItem[] {
  const groups =
    activeCategoryId === "all"
      ? catalog
      : catalog.filter((g) => g.categoryId === activeCategoryId);
  const items: FlatItem[] = [];
  for (const g of groups) {
    for (const mark of g.marks) {
      items.push({
        mark,
        categoryId: g.categoryId,
        label: g.label,
        section: g.section,
      });
    }
  }
  return items;
}

interface MarkComboboxProps {
  handbook: SteelHandbook;
  filterGroups?: string[];
  value: string;
  onChange: (mark: string) => void;
  onOpenFullPicker?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MarkCombobox({
  handbook,
  filterGroups = [],
  value,
  onChange,
  onOpenFullPicker,
  placeholder = "Введите или выберите марку",
  disabled,
  className,
}: MarkComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const catalog = useMemo(
    () => getMarkBrowseCatalog(handbook, filterGroups, query),
    [handbook, filterGroups, query]
  );

  const tabs = useMemo(
    () => [
      { id: "all", label: "Все", count: catalog.reduce((n, g) => n + g.marks.length, 0) },
      ...catalog.map((g) => ({ id: g.categoryId, label: g.label, count: g.marks.length })),
    ],
    [catalog]
  );

  const searching = query.trim().length > 0;
  const effectiveCategoryId = searching ? "all" : activeCategoryId;

  const flat = useMemo(
    () => flattenCatalog(catalog, effectiveCategoryId),
    [catalog, effectiveCategoryId]
  );

  const visibleGroups = useMemo(
    () =>
      effectiveCategoryId === "all"
        ? catalog
        : catalog.filter((g) => g.categoryId === effectiveCategoryId),
    [catalog, effectiveCategoryId]
  );

  useEffect(() => {
    setHighlight(0);
  }, [query, open, effectiveCategoryId]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (mark: string) => {
    setQuery(mark);
    onChange(mark);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flat[highlight]) {
      e.preventDefault();
      pick(flat[highlight].mark);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const totalMarks = tabs[0]?.count ?? 0;

  return (
    <div ref={rootRef} className={cn("relative flex-1", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <input
          id={listId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listId}-listbox`}
          aria-autocomplete="list"
          disabled={disabled}
          autoComplete="off"
          className={cn(
            "h-11 w-full rounded-lg border-2 bg-[var(--color-card)] py-2 pl-9 pr-10 text-sm font-medium",
            "border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40",
            disabled && "cursor-not-allowed opacity-60",
            value && "text-[var(--color-foreground)]"
          )}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Открыть список марок по типам металла"
        >
          <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && !disabled && (
        <div
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 flex w-full min-w-[320px] flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl"
        >
          {!searching && tabs.length > 1 && (
            <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                    effectiveCategoryId === tab.id
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveCategoryId(tab.id)}
                >
                  {tab.label}
                  <span className="ml-1 opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>
          )}

          <ul className="max-h-72 overflow-y-auto py-1">
            {flat.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
                {totalMarks === 0 && filterGroups.length > 0
                  ? "Нет марок в выбранных категориях — снимите фильтр ниже"
                  : "Марка не найдена"}
                {onOpenFullPicker && (
                  <button
                    type="button"
                    className="mt-2 block w-full text-[var(--color-primary)] hover:underline"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setOpen(false);
                      onOpenFullPicker();
                    }}
                  >
                    Выбор с сортаментом…
                  </button>
                )}
              </li>
            ) : searching ? (
              flat.map((item, i) => (
                <li key={`${item.categoryId}-${item.mark}`} role="option" aria-selected={item.mark === value}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col px-3 py-2 text-left transition-colors",
                      i === highlight && "bg-[var(--color-primary)]/15",
                      i !== highlight && "hover:bg-[var(--color-accent)]"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(item.mark)}
                  >
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        i === highlight ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"
                      )}
                    >
                      {item.mark}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">
                      {item.section} · {item.label}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              visibleGroups.map((group, gi) => {
                let idx = 0;
                for (let k = 0; k < gi; k++) idx += visibleGroups[k].marks.length;
                const showSection =
                  effectiveCategoryId === "all" &&
                  (gi === 0 || visibleGroups[gi - 1].section !== group.section);

                return (
                  <li key={group.categoryId} className="list-none">
                    {showSection && (
                      <div className="sticky top-0 z-10 bg-[var(--color-muted)]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)] backdrop-blur-sm">
                        {group.section}
                      </div>
                    )}
                    <div className="px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
                      {group.label}
                      <span className="ml-1 font-normal">({group.marks.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-0.5 px-2 pb-2 sm:grid-cols-3">
                      {group.marks.map((mark, mi) => {
                        const i = idx + mi;
                        return (
                          <button
                            key={mark}
                            type="button"
                            role="option"
                            aria-selected={mark === value}
                            className={cn(
                              "rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors",
                              i === highlight && "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
                              mark === value && i !== highlight && "bg-[var(--color-muted)]",
                              i !== highlight && mark !== value && "hover:bg-[var(--color-accent)]"
                            )}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setHighlight(i)}
                            onClick={() => pick(mark)}
                          >
                            {mark}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {onOpenFullPicker && flat.length > 0 && (
            <div className="border-t border-[var(--color-border)] p-2">
              <button
                type="button"
                className="w-full rounded-lg py-2 text-xs text-[var(--color-primary)] hover:bg-[var(--color-accent)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  onOpenFullPicker();
                }}
              >
                Выбор марки и сортамента…
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
