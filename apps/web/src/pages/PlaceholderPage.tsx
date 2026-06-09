export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">{description}</p>
      <p className="mt-4 text-sm">Раздел будет расширен в следующих итерациях.</p>
    </div>
  );
}
