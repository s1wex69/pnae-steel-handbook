import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DecimalPlacesControl } from "@/components/calculators/DecimalPlacesControl";
import { loadDecimalPlaces, saveDecimalPlaces } from "@/lib/decimalPlaces";
import {
  FormulaBoltW,
  FormulaBoltWt,
  FormulaPressure,
  FormulaShell,
  FormulaStressRangeLimit,
} from "@/components/handbooks/In1Formulas";
import { In1Symbol, in1SymbolIdForMode } from "@/components/handbooks/In1Symbol";
import { Frac, Var } from "@/components/handbooks/MathNotation";
import { cn, formatDecimalPlaces } from "@/lib/utils";

const MODES = [
  { value: "pressure_internal", label: "Внутреннее давление" },
  { value: "pressure_external", label: "Наружное > внутреннего" },
  { value: "bolt", label: "Болты / шпильки" },
  { value: "bolt_high_temp", label: "Болты при T > Tt" },
  { value: "containment_shell", label: "Страховочные / защитные оболочки" },
  { value: "stress_range_equipment", label: "Размах — оборудование" },
  { value: "stress_range_piping", label: "Размах — трубопроводы" },
] as const;

type Mode = (typeof MODES)[number]["value"];

function ModeDesc({ mode }: { mode: Mode }) {
  switch (mode) {
    case "pressure_internal":
      return <FormulaPressure />;
    case "pressure_external":
      return <FormulaPressure />;
    case "bolt":
      return <FormulaBoltW />;
    case "bolt_high_temp":
      return <FormulaBoltWt />;
    case "containment_shell":
      return <FormulaShell />;
    case "stress_range_equipment":
      return <FormulaStressRangeLimit symbol="RV" />;
    case "stress_range_piping":
      return <FormulaStressRangeLimit symbol="RK" />;
  }
}

function ActiveFormula({ mode }: { mode: Mode }) {
  return (
    <div className="flex justify-center py-2 text-lg">
      <ModeDesc mode={mode} />
    </div>
  );
}

function CandidateLabel({ id, mode }: { id: string; mode: Mode }) {
  const external = mode === "pressure_external";
  switch (id) {
    case "rm":
      return <Frac num={<Var letter="R" sub="m" />} den="2,6" />;
    case "rp02":
      return (
        <Frac num={<Var letter="R" sub="p0,2" />} den={external ? "2" : "1,5"} />
      );
    case "rmt":
      return (
        <Frac num={<Var letter="R" sub="mt" />} den={external ? "2" : "1,5"} />
      );
    case "sigmaW":
      return <In1Symbol id="sigma_w" />;
    case "sigmaWt":
      return <In1Symbol id="sigma_wt" />;
    case "sigmaC":
      return <In1Symbol id="sigma_c" />;
    case "result":
      return <In1Symbol id={in1SymbolIdForMode(mode)} />;
    case "calculated":
      return <>Расчётное значение</>;
    case "cap":
      return (
        <>
          2<Var letter="R" sub="p0,2" />
        </>
      );
    default:
      return <>{id}</>;
  }
}

interface ApiResult {
  formula: string;
  modeLabel: string;
  standard: string;
  coefficients?: Record<string, number>;
  results: Record<string, number | string | boolean | null>;
  candidates?: { id: string; label: string; value: number; formula: string }[];
  notes?: string[];
}

export function AllowableStressCalculatorPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("pressure_internal");
  const [rm, setRm] = useState(
    searchParams.get("tensileStrength") || searchParams.get("rm") || "490"
  );
  const [rp02, setRp02] = useState(
    searchParams.get("yieldStrength") || searchParams.get("rp02") || "196"
  );
  const [rmt, setRmt] = useState("");
  const [temperature, setTemperature] = useState(
    searchParams.get("temperature") || "20"
  );
  const [boltTt, setBoltTt] = useState("350");
  const [decimalPlaces, setDecimalPlaces] = useState(() => loadDecimalPlaces("in-1-allowable-stress"));
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsRmt = mode === "pressure_internal" || mode === "pressure_external";
  const needsTemp = mode === "bolt_high_temp";

  const calculate = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        mode,
        rm: Number(rm),
        rp02: Number(rp02),
        decimalPlaces,
      };
      if (rmt.trim()) body.rmt = Number(rmt);
      if (needsTemp) {
        body.designTemperature = Number(temperature);
        body.boltThresholdT = Number(boltTt);
      }
      const data = await api<ApiResult>("/calculators/in-1-allowable-stress/calculate", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка расчёта");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [mode, rm, rp02, rmt, temperature, boltTt, needsTemp, decimalPlaces]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (Number(rm) > 0 && Number(rp02) > 0) calculate();
    }, 450);
    return () => clearTimeout(t);
  }, [mode, rm, rp02, rmt, temperature, boltTt, decimalPlaces, calculate]);

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

  const mainValue = result?.results.allowableStress;
  const displayDecimals =
    typeof result?.results.decimalPlaces === "number"
      ? Number(result.results.decimalPlaces)
      : decimalPlaces;
  const mainValueText =
    mainValue != null && typeof mainValue === "number"
      ? formatDecimalPlaces(mainValue, displayDecimals)
      : null;

  const onDecimalPlacesChange = (places: number) => {
    setDecimalPlaces(places);
    saveDecimalPlaces("in-1-allowable-stress", places);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">ИН № 1 — Допускаемые напряжения</h1>
          <p className="text-[var(--color-muted-foreground)]">
            Все варианты по методике ПНАЭ: давление, болты, оболочки, размах напряжений
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/methodologies/in-1-dopuskaemye-napryazheniya">
            <FileText className="h-4 w-4" />
            Методика
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Вариант расчёта</CardTitle>
          <CardDescription>Выберите условие нагружения элемента</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition-all",
                  mode === m.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40"
                )}
              >
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                  <ModeDesc mode={m.value} />
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Механические характеристики при T</CardTitle>
            <CardDescription>
              Rm и Rp0,2 — из{" "}
              <Link to="/handbooks/pnae-steel" className="text-[var(--color-primary)] underline">
                справочника сталей
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rm">Rm — временное сопротивление, МПа</Label>
              <Input id="rm" type="number" value={rm} onChange={(e) => setRm(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp02">Rp0,2 — предел текучести, МПа</Label>
              <Input id="rp02" type="number" value={rp02} onChange={(e) => setRp02(e.target.value)} />
            </div>
            {needsRmt && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="rmt" className="inline-flex items-baseline gap-1">
                <Var letter="R" sub="mt" /> — длительная прочность (необязательно), МПа
              </Label>
                <Input
                  id="rmt"
                  type="number"
                  placeholder="Для высоких температур"
                  value={rmt}
                  onChange={(e) => setRmt(e.target.value)}
                />
              </div>
            )}
            {needsTemp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="temp">Расчётная температура T, °C</Label>
                  <Input
                    id="temp"
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tt">Пороговая Tt, °C</Label>
                  <Input
                    id="tt"
                    type="number"
                    value={boltTt}
                    onChange={(e) => setBoltTt(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <DecimalPlacesControl value={decimalPlaces} onChange={onDecimalPlacesChange} />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={calculate} disabled={loading}>
                {loading ? "Расчёт…" : "Рассчитать (Ctrl+Enter)"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Формула</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <ActiveFormula mode={mode} />
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--color-destructive)] bg-[var(--color-destructive)]/10 px-4 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      {result && (
        <Card className="print-report border-[var(--color-primary)]/30">
          <CardHeader>
            <CardTitle>Результаты</CardTitle>
            <CardDescription>
              {result.modeLabel} · {result.standard}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mainValueText != null && (
              <div className="rounded-xl bg-[var(--color-primary)]/10 px-4 py-3 text-center">
                <p className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
                  <In1Symbol id={in1SymbolIdForMode(mode)} />
                  <span>, МПа</span>
                </p>
                <p className="text-3xl font-bold text-[var(--color-primary)] tabular-nums">
                  {mainValueText} МПа
                </p>
                {result.results.governingTerm && (
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {String(result.results.governingTerm)}
                  </p>
                )}
              </div>
            )}

            {result.results.temperatureApplies === false && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                Условие T &gt; Tt не выполнено — номинальное{" "}
                <In1Symbol id="sigma_wt" className="inline" /> не устанавливается.
              </p>
            )}

            {result.coefficients && (
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(result.coefficients).map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded-md bg-[var(--color-muted)] px-2 py-1 font-mono"
                  >
                    {k} = {v}
                  </span>
                ))}
              </div>
            )}

            {result.candidates && result.candidates.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-muted)]">
                    <tr>
                      <th className="px-3 py-2 text-left">Слагаемое</th>
                      <th className="px-3 py-2 text-right">Значение, МПа</th>
                      <th className="px-3 py-2 text-left">Коэффициент</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.candidates.map((c) => (
                      <tr key={c.id} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2">
                          <CandidateLabel id={c.id} mode={mode} />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          {formatDecimalPlaces(c.value, displayDecimals)}
                        </td>
                        <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                          {c.formula}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.results.limitedByCap && (
              <p className="text-sm text-amber-500">
                Применено ограничение: не более 2·Rp0,2 ={" "}
                {typeof result.results.stressRangeCap === "number"
                  ? formatDecimalPlaces(result.results.stressRangeCap, displayDecimals)
                  : result.results.stressRangeCap}{" "}
                МПа
              </p>
            )}

            {result.notes?.map((n) => (
              <p key={n} className="text-sm text-[var(--color-muted-foreground)]">
                {n}
              </p>
            ))}

            <Button variant="outline" onClick={() => window.print()}>
              Сформировать отчёт (печать / PDF)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
