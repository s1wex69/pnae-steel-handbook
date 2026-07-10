import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  GraduationCap,
  LayoutGrid,
  Library,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/calculators", label: "Калькуляторы", icon: Calculator },
  { to: "/handbooks/pnae-steel", label: "ПНАЭ", icon: BookOpen },
  { to: "/handbooks/gost34233-1", label: "ГОСТ 34233.1", icon: BookOpen },
  { to: "/gosts", label: "ГОСТы", icon: Scale },
  { to: "/examples", label: "Примеры", icon: GraduationCap },
  { to: "/glossary", label: "Глоссарий", icon: Library },
];

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex w-56 shrink-0 flex-col gap-1 border-r border-[var(--color-border)] bg-[var(--color-card)] p-3",
        className
      )}
    >
      <NavLink
        to="/"
        className="mb-4 flex items-center gap-2 rounded-lg px-2 py-2 font-semibold text-[var(--color-primary)]"
      >
        <LayoutGrid className="h-5 w-5" />
        ИНТЕХ-АТОМ
      </NavLink>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-medium"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
