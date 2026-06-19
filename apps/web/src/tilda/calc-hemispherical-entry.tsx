import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { ConvexHeadInternalCalculator } from "@/components/calculators/ConvexHeadInternalCalculator";
import { loadHandbookData } from "@/lib/handbookDataLoader";
import { ThemeProvider } from "@/hooks/useTheme";
import { TildaShell } from "@/tilda/TildaShell";
import "@/tilda/tilda.css";

function CalcHemisphericalApp() {
  const [data, setData] = useState<SteelHandbook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHandbookData()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-base text-[var(--color-muted-foreground)]">Загрузка справочника…</p>;
  }
  if (!data) {
    return <p className="text-base text-[var(--color-destructive)]">Не удалось загрузить справочник ПНАЭ</p>;
  }
  return <ConvexHeadInternalCalculator handbook={data} kind="hemispherical" />;
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <TildaShell>
      <CalcHemisphericalApp />
    </TildaShell>
  </ThemeProvider>
);
