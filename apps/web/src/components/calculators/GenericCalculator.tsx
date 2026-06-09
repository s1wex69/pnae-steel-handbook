import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import katex from "katex";
import { api } from "@/lib/api";
import type { CalculatorConfig } from "@/config/calculators";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DecimalPlacesControl } from "@/components/calculators/DecimalPlacesControl";
import { loadDecimalPlaces, saveDecimalPlaces } from "@/lib/decimalPlaces";
import { formatDecimalPlaces } from "@/lib/utils";

interface CalcApiResponse {
  results: Record<string, number | string>;
  standard: string;
  notes?: string[];
}

function buildDefaults(config: CalculatorConfig): Record<string, string> {
  return Object.fromEntries(config.fields.map((f) => [f.key, f.default]));
}

function buildBody(
  config: CalculatorConfig,
  form: Record<string, string>,
  decimalPlaces: number
): Record<string, number | string> {
  const body: Record<string, number | string> = { decimalPlaces };
  for (const field of config.fields) {
    const raw = form[field.key];
    if (raw === "" && field.optional) continue;
    if (field.type === "select") {
      body[field.key] = raw;
    } else {
      body[field.key] = Number(raw);
    }
  }
  return body;
}

function canCalculate(config: CalculatorConfig, form: Record<string, string>): boolean {
  if (config.requiredKeys.length === 0) return true;
  return config.requiredKeys.every((k) => {
    const v = form[k];
    if (v === undefined || v === "") return false;
    const field = config.fields.find((f) => f.key === k);
    if (field?.type === "select") return true;
    return Number(v) > 0;
  });
}

export function GenericCalculator({ config }: { config: CalculatorConfig }) {
  const [form, setForm] = useState(() => {
    const defaults = buildDefaults(config);
    return defaults;
  });
  const [decimalPlaces, setDecimalPlaces] = useState(() => loadDecimalPlaces(config.id));
  const [result, setResult] = useState<CalcApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(buildDefaults(config));
    setDecimalPlaces(loadDecimalPlaces(config.id));
    setResult(null);
    setError(null);
  }, [config.id]);

  const formulaHtml = useMemo(
    () =>
      katex.renderToString(config.formulaLatex, {
        throwOnError: false,
        displayMode: true,
      }),
    [config.formulaLatex]
  );

  const calculate = useCallback(async () => {
    if (!canCalculate(config, form)) return;
    setError(null);
    setLoading(true);
    try {
      const data = await api<CalcApiResponse>(`/calculators/${config.id}/calculate`, {
        method: "POST",
        body: JSON.stringify(buildBody(config, form, decimalPlaces)),
      });
      setResult(data);
      const historyKey = `calc-history-${config.id}`;
      const raw = localStorage.getItem(historyKey);
      const list = raw ? (JSON.parse(raw) as unknown[]) : [];
      list.unshift({
        inputs: buildBody(config, form, decimalPlaces),
        results: data.results,
        at: new Date().toISOString(),
      });
      localStorage.setItem(historyKey, JSON.stringify(list.slice(0, 10)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка расчёта");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [config, form, decimalPlaces]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (canCalculate(config, form)) calculate();
    }, 400);
    return () => clearTimeout(t);
  }, [form, config, decimalPlaces, calculate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        calculate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [calculate]);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="text-[var(--color-muted-foreground)]">
            {config.subtitle} — <strong>{config.standard}</strong>
          </p>
        </div>
        {config.methodologySlug && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/methodologies/${config.methodologySlug}`}>
              <FileText className="h-4 w-4" />
              Методика
            </Link>
          </Button>
        )}
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Исходные данные</CardTitle>
            <CardDescription>Ctrl+Enter — пересчёт</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.unit && (
                    <span className="ml-1 text-[var(--color-muted-foreground)]">({field.unit})</span>
                  )}
                </Label>
                {field.type === "select" && field.options ? (
                  <select
                    id={field.key}
                    className="flex h-9 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 text-sm"
                    value={form[field.key]}
                    onChange={update(field.key)}
                  >
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={field.key}
                    type="number"
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    value={form[field.key]}
                    onChange={update(field.key)}
                  />
                )}
                {field.hint && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">{field.hint}</p>
                )}
              </div>
            ))}
            <div className="sm:col-span-2">
              <DecimalPlacesControl
                value={decimalPlaces}
                onChange={(places) => {
                  setDecimalPlaces(places);
                  saveDecimalPlaces(config.id, places);
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={calculate} disabled={loading} className="w-full sm:w-auto">
                {loading ? "Расчёт…" : "Рассчитать (Ctrl+Enter)"}
              </Button>
            </div>
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Формула</CardTitle>
        </CardHeader>
        <CardContent
          className="overflow-x-auto text-center"
          dangerouslySetInnerHTML={{ __html: formulaHtml }}
        />
      </Card>

      {error && (
        <p className="rounded-lg border border-[var(--color-destructive)] bg-[var(--color-destructive)]/10 px-4 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      {result && (
        <Card className="print-report border-[var(--color-primary)]/30">
          <CardHeader>
            <CardTitle>Результаты</CardTitle>
            <CardDescription>{result.standard}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.resultFields.map((rf) => {
                const val = result.results[rf.key];
                if (val === undefined) return null;
                const places =
                  typeof result.results.decimalPlaces === "number"
                    ? Number(result.results.decimalPlaces)
                    : decimalPlaces;
                const display =
                  typeof val === "number" ? formatDecimalPlaces(val, places) : val;
                return (
                  <div key={rf.key}>
                    <dt className="text-sm text-[var(--color-muted-foreground)]">{rf.label}</dt>
                    <dd
                      className={
                        rf.highlight
                          ? "text-2xl font-bold text-[var(--color-primary)]"
                          : "text-lg font-semibold"
                      }
                    >
                      {display}
                      {rf.unit ? ` ${rf.unit}` : ""}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {result.notes && result.notes.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--color-muted-foreground)]">
                {result.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <Button variant="outline" className="mt-4" onClick={() => window.print()}>
              Сформировать отчёт (печать / PDF)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
