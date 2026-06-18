import { NavLink } from "react-router-dom";
import { BookOpen, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Справочник", icon: BookOpen, end: true },
  { to: "/calculators", label: "Калькуляторы", icon: Calculator, end: false },
] as const;

export function PnaeNav() {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all",
              isActive
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md"
                : "border-[var(--color-primary)]/25 bg-[var(--color-card)] text-[var(--color-heading)] hover:border-[var(--color-primary)]/50 hover:shadow-md"
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
