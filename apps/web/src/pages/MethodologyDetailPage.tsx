import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MethodologyDetail {
  slug: string;
  title: string;
  description: string;
  html_content: string;
  tags: string[];
  version: string;
  original_filename: string;
  created_at: string;
  toc: { id: string; text: string; level: number }[];
}

export function MethodologyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<MethodologyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api<MethodologyDetail>(`/methodologies/${slug}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-[var(--color-destructive)]">{error ?? "Не найдено"}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(200px,260px)_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Оглавление
        </h2>
        <nav className="max-h-[70vh] overflow-y-auto rounded-lg border border-[var(--color-border)] p-3 text-sm">
          {data.toc.length === 0 ? (
            <p className="text-[var(--color-muted-foreground)]">Заголовки не найдены</p>
          ) : (
            <ul className="space-y-1">
              {data.toc.map((h) => (
                <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                  <a href={`#${h.id}`} className="hover:text-[var(--color-primary)]">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
        <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
          <a href={`/api/methodologies/${data.slug}/download`} download>
            <Download className="h-4 w-4" />
            Скачать .docx
          </a>
        </Button>
      </aside>

      <article className="min-w-0">
        <header className="mb-6 space-y-2 border-b border-[var(--color-border)] pb-4">
          <h1 className="text-2xl font-bold">{data.title}</h1>
          {data.description && (
            <p className="text-[var(--color-muted-foreground)]">{data.description}</p>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted-foreground)]">
            <span>v{data.version}</span>
            <span>·</span>
            <span>{new Date(data.created_at).toLocaleDateString("ru-RU")}</span>
            <span>·</span>
            <span>{data.original_filename}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {data.tags.map((t) => (
              <span key={t} className="rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-xs">
                {t}
              </span>
            ))}
          </div>
        </header>
        <div
          className="methodology-content prose-invert max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: data.html_content }}
        />
        <p className="mt-8">
          <Link to="/methodologies" className="text-sm text-[var(--color-primary)]">
            ← К списку методик
          </Link>
        </p>
      </article>
    </div>
  );
}
