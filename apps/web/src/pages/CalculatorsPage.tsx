import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type CalculatorItem } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

export function CalculatorsPage() {
  const [items, setItems] = useState<CalculatorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: CalculatorItem[] }>("/calculators")
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Калькуляторы</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Интерактивные расчёты с мгновенным результатом и экспортом отчёта
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((c) => (
          <Card
            key={c.id}
            className={c.enabled ? "hover:border-[var(--color-primary)]/50" : "opacity-60"}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  {c.enabled ? (
                    <Link to={`/calculators/${c.id}`} className="hover:underline">
                      {c.title}
                    </Link>
                  ) : (
                    c.title
                  )}
                </CardTitle>
                {!c.enabled && <Badge>В разработке</Badge>}
              </div>
              {c.standard && (
                <Badge className="w-fit text-[var(--color-primary)]">{c.standard}</Badge>
              )}
              <CardDescription>{c.description}</CardDescription>
            </CardHeader>
            {c.enabled && (
              <CardContent>
                <Link
                  to={`/calculators/${c.id}`}
                  className="text-sm font-medium text-[var(--color-primary)]"
                >
                  Открыть калькулятор →
                </Link>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
