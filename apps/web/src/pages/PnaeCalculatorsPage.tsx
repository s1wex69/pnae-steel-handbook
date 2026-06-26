import { Link } from "react-router-dom";
import { Circle, Cylinder, Disc, ChevronRight, Cone, CornerDownRight, Bolt } from "lucide-react";

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
    title: "Полусферическое днище — внутреннее давление",
    subtitle: "ИН № 5",
    icon: Circle,
    available: true,
  },
  {
    id: "elliptical-head",
    to: "/calculators/elliptical-head",
    title: "Эллиптическое днище — внутреннее давление",
    subtitle: "ИН № 5",
    icon: Circle,
    available: true,
  },
  {
    id: "torispherical-head",
    to: "/calculators/torispherical-head",
    title: "Торосферическое днище — внутреннее давление",
    subtitle: "ИН № 5",
    icon: Circle,
    available: true,
  },
  {
    id: "pipe-internal",
    to: "/calculators/pipe-internal",
    title: "Расчёт на прочность трубы, штуцера, коллектора",
    subtitle: "п. 4.2.2",
    icon: Cylinder,
    available: true,
  },
  {
    id: "elbow",
    to: "/calculators/elbow",
    title: "Расчёт колена на внутреннее давление",
    subtitle: "п. 4.2.2.3–4.2.2.9",
    icon: CornerDownRight,
    available: true,
  },
  {
    id: "bolts-studs-nuts",
    to: "/calculators/bolts-studs-nuts",
    title: "Расчёт болтов, шпилек и гаек",
    subtitle: "разд. 3.9 ПНАЭ",
    icon: Bolt,
    available: true,
  },
  {
    id: "conical-shell-internal",
    to: "/calculators/conical-shell-internal",
    title: "Расчёт на прочность конической обечайки, нагруженной внутренним избыточным давлением",
    subtitle: "ГОСТ 34233.2-2017",
    icon: Cone,
    available: true,
  },
  {
    id: "flat-bottom",
    to: "/calculators/flat-bottom",
    title: "Плоское круглое днище",
    subtitle: "§7.2",
    icon: Disc,
    available: true,
  },
  {
    id: "flat-cover",
    to: "/calculators/flat-cover",
    title: "Плоская круглая крышка с краевым моментом",
    subtitle: "§7.3",
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
