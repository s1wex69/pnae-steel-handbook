import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type MethodologyListItem } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function MethodologiesPage() {
  const [items, setItems] = useState<MethodologyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    api<{ items: MethodologyListItem[] }>(`/methodologies${params}`)
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Методики расчёта</h1>
          <p className="text-[var(--color-muted-foreground)]">
            Документы .docx с автоматической конвертацией в HTML
          </p>
        </div>
        <Input
          placeholder="Поиск по названию…"
          className="max-w-xs"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)]">
          Методики пока не загружены. Администратор может добавить их в{" "}
          <Link to="/admin" className="text-[var(--color-primary)] underline">
            панели управления
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4">
          {items.map((m) => (
            <Link key={m.id} to={`/methodologies/${m.slug}`}>
              <Card className="transition-colors hover:border-[var(--color-primary)]/40">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{m.title}</CardTitle>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      v{m.version}
                    </span>
                  </div>
                  <CardDescription>{m.description || "Без описания"}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {m.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {new Date(m.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
