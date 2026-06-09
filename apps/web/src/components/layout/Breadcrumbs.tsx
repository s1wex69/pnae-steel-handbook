import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALCULATOR_LABELS } from "@/config/calculators";

const LABELS: Record<string, string> = {
  calculators: "Калькуляторы",
  methodologies: "Методики",
  account: "Учётная запись",
  register: "Регистрация",
  login: "Вход",
  handbooks: "Справочники",
  "pnae-steel": "Свойства сталей ПНАЭ",
  gosts: "ГОСТы",
  examples: "Примеры расчётов",
  glossary: "Глоссарий",
  admin: "Админ-панель",
  ...CALCULATOR_LABELS,
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: LABELS[seg] ?? decodeURIComponent(seg),
    path: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
      <Link to="/" className="hover:text-[var(--color-foreground)]">
        <Home className="h-4 w-4" />
      </Link>
      {crumbs.map((c) => (
        <span key={c.path} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {c.last ? (
            <span className={cn("text-[var(--color-foreground)]")}>{c.label}</span>
          ) : (
            <Link to={c.path} className="hover:text-[var(--color-foreground)]">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
