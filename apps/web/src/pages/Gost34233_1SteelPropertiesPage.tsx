import { useEffect, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { GostSteelWorktable } from "@/components/handbooks/GostSteelWorktable";
import { HandbookStandardSwitch } from "@/components/handbooks/HandbookStandardSwitch";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Gost34233_1SteelPropertiesPage() {
  const [data, setData] = useState<SteelHandbook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("./data/gost34233-1-steel-properties.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<SteelHandbook>;
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
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
    return (
      <p className="min-w-0 text-[var(--color-destructive)]">
        Не удалось загрузить справочник ГОСТ 34233.1
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-10">
      <div className="relative min-w-0 max-w-full rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)] sm:p-10">
        <ThemeToggle className="absolute top-4 right-4 sm:top-6 sm:right-6" />
        <div className="pr-12">
          <p className="text-sm font-normal text-[var(--color-muted-foreground)] sm:text-base">
            Допускаемые напряжения и механические характеристики
          </p>
          <h1 className="mt-0.5 font-sans text-2xl font-bold uppercase leading-tight tracking-wide text-[var(--color-heading)] sm:text-3xl">
            ГОСТ 34233.1-2017
          </h1>
          <p className="mt-3 w-full text-lg font-semibold leading-snug text-[var(--color-heading)]">
            Данные оформлены в том же стиле, что и ПНАЭ
          </p>
          <p className="mt-2 w-full text-base leading-snug text-[var(--color-muted-foreground)]">
            Выбор марки, сортамента, температуры и вывод σ, σ13, σRV по ГОСТ 34233.1—2017
          </p>
          <HandbookStandardSwitch active="gost34233-1" className="mt-5" />
        </div>
      </div>

      <GostSteelWorktable handbook={data} />
    </div>
  );
}

