import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HANDBOOKS = [
  {
    to: "/handbooks/pnae-steel",
    title: "Физико-механические свойства сталей",
    description:
      "ПНАЭ: выбор типа, марки, сортамента и температуры — Rm, Rp0,2, [σ], E и α",
    badge: "ПНАЭ",
  },
  {
    to: "/handbooks/gost34233-1",
    title: "Допускаемые напряжения по ГОСТ 34233.1",
    description:
      "ГОСТ 34233.1—2017: марки, сортамент, температура — σ, σ13, σRV по приложению А и п. 8.1",
    badge: "ГОСТ",
  },
];

export function HandbooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Справочники</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Нормативные таблицы с поиском, фильтрацией и копированием значений
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {HANDBOOKS.map((h) => (
          <Link key={h.to} to={h.to}>
            <Card className="h-full transition-colors hover:border-[var(--color-primary)]/40">
              <CardHeader>
                <span className="w-fit rounded-md bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                  {h.badge}
                </span>
                <CardTitle className="text-lg">{h.title}</CardTitle>
                <CardDescription>{h.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-[var(--color-primary)]">Открыть →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
