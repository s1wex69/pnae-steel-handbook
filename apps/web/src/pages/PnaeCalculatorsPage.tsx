import { Link } from "react-router-dom";
import { Circle, Cylinder, Disc, CornerDownRight, ChevronRight } from "lucide-react";

const CALCULATORS = [
  {
    id: "cylindrical-shell-internal",
    to: "/calculators/cylindrical-shell-internal",
    title: "Цилиндрическая обечайка — внутреннее давление",
    subtitle: "ИН № 3",
    icon: Cylinder,
    available: true,
  },
  {
    id: "cylindrical-shell-external",
    to: "/calculators/cylindrical-shell-external",
    title: "Цилиндрическая обечайка — наружное давление",
    subtitle: "ИН № 3",
    icon: Cylinder,
    available: true,
  },
  {
    id: "hemispherical-head",
    to: "/calculators/hemispherical-head",
    title: "Полусферическое днище",
    subtitle: "ИН № 6",
    icon: Circle,
    available: true,
  },
  {
    id: "pipe-collector",
    to: "/calculators/pipe-collector",
    title: "Коллектор, штуцер, труба",
    subtitle: "ИН № 7",
    icon: Cylinder,
    available: true,
  },
  {
    id: "elbow",
    to: "/calculators/elbow",
    title: "Колено",
    subtitle: "ИН № 8",
    icon: CornerDownRight,
    available: true,
  },
  {
    id: "flat-circular-head",
    to: "/calculators/flat-circular-head",
    title: "Круглые плоские днища и крышки",
    subtitle: "ИН № 9",
    icon: Disc,
    available: true,
  },
] as const;

export function PnaeCalculatorsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-[var(--color-heading)]">
          Калькуляторы
        </h1>
      </div>

      <ul className="grid gap-4">
        {CALCULATORS.map((c) => (
          <li key={c.id}>
            <Link
              to={c.available ? c.to : "#"}
              className="group flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-colors hover:border-[var(--color-primary)]/40"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                <c.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{c.subtitle}</p>
                <h2 className="font-semibold text-[var(--color-heading)] group-hover:text-[var(--color-primary)]">
                  {c.title}
                </h2>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
