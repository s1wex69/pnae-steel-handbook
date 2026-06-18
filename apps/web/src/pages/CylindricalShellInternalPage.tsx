import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { SteelHandbook } from "@/types/steel";
import { CylindricalShellInternalCalculator } from "@/components/calculators/CylindricalShellInternalCalculator";
import { Skeleton } from "@/components/ui/skeleton";

export function CylindricalShellInternalPage() {
  const [data, setData] = useState<SteelHandbook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/pnae-steel-properties.json")
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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-[var(--color-destructive)]">Не удалось загрузить справочник ПНАЭ</p>;
  }

  return (
    <div className="space-y-3">
      <Link
        to="/calculators"
        className="inline-flex items-center gap-1.5 text-base text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Все калькуляторы
      </Link>

      <CylindricalShellInternalCalculator handbook={data} />
    </div>
  );
}
