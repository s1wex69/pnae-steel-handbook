import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Trash2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, type MethodologyListItem } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [version, setVersion] = useState("1.0");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [list, setList] = useState<MethodologyListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const loadList = () => {
    setListLoading(true);
    api<{ items: MethodologyListItem[] }>("/methodologies?all=true")
      .then((d) => setList(d.items))
      .catch(() => setList([]))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    if (!loading && isAdmin) loadList();
  }, [loading, isAdmin]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <p className="text-[var(--color-destructive)]">
        Доступ запрещён. Войдите как администратор.
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setStatus("Укажите название и файл .docx");
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("description", description);
      fd.append("tags", tags);
      fd.append("version", version);
      fd.append("published", "true");
      const token = localStorage.getItem("token");
      const res = await fetch("/api/methodologies", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка загрузки");
      setStatus(`Опубликовано: /methodologies/${json.item.slug}`);
      setTitle("");
      setDescription("");
      setTags("");
      setFile(null);
      loadList();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Админ-панель</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Загрузка методик (.docx → HTML через mammoth)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Новая методика
          </CardTitle>
          <CardDescription>
            Документ будет сконвертирован с сохранением таблиц, изображений и заголовков
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Описание</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Теги (через запятую)</Label>
              <Input
                id="tags"
                placeholder="ГОСТ, сосуд, прочность"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Версия</Label>
              <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Файл .docx *</Label>
              <Input
                id="file"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? "Конвертация…" : "Загрузить и опубликовать"}
            </Button>
            {status && (
              <p
                className={`text-sm ${status.startsWith("Опубликовано") ? "text-emerald-500" : "text-[var(--color-destructive)]"}`}
              >
                {status}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Опубликованные методики</CardTitle>
          <CardDescription>Управление загруженными документами</CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <Skeleton className="h-24" />
          ) : list.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Пока нет методик</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {list.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <Link
                      to={`/methodologies/${m.slug}`}
                      className="font-medium hover:text-[var(--color-primary)]"
                    >
                      {m.title}
                    </Link>
                    <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                      v{m.version} · {new Date(m.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить"
                    onClick={async () => {
                      if (!confirm(`Удалить «${m.title}»?`)) return;
                      const token = localStorage.getItem("token");
                      const res = await fetch(`/api/methodologies/${m.slug}`, {
                        method: "DELETE",
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      if (res.ok) loadList();
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--color-destructive)]" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Учётная запись по умолчанию</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-muted-foreground)]">
          <p>Email: admin@intech-atom.local</p>
          <p>Пароль: admin123</p>
          <p className="mt-2">Смените пароль после первого входа в production.</p>
        </CardContent>
      </Card>
    </div>
  );
}
