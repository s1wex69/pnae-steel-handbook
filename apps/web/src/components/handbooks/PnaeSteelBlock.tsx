import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calculator,
  Copy,
  Check,
  Trash2,
  Search,
  Layers,
  Tag,
  Package,
  Thermometer,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { SteelGrade, SteelHandbook } from "@/types/steel";
import {
  displayMark,
  extractSortament,
  findGrade,
  getGroups,
  getMarks,
  getSortaments,
  MECH_PROPS,
  valueAt,
} from "@/lib/steelHandbook";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectStep, StyledSelect } from "@/components/handbooks/SelectStep";
import { cn } from "@/lib/utils";

export interface PnaeSteelBlockState {
  group: string;
  mark: string;
  sortament: string;
  temperature: number;
  determined: boolean;
}

interface Props {
  handbook: SteelHandbook;
  index: number;
  state: PnaeSteelBlockState;
  onChange: (patch: Partial<PnaeSteelBlockState>) => void;
  onRemove?: () => void;
  canRemove: boolean;
}

function stepStatus(
  filled: boolean,
  locked: boolean,
  isNext: boolean
): "empty" | "active" | "done" | "locked" {
  if (locked) return "locked";
  if (filled) return "done";
  if (isNext) return "active";
  return "empty";
}

export function PnaeSteelBlock({
  handbook,
  index,
  state,
  onChange,
  onRemove,
  canRemove,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const groups = useMemo(() => getGroups(handbook), [handbook]);
  const marks = useMemo(
    () => (state.group ? getMarks(handbook, state.group) : []),
    [handbook, state.group]
  );
  const sortaments = useMemo(
    () =>
      state.group && state.mark
        ? getSortaments(handbook, state.group, state.mark)
        : [],
    [handbook, state.group, state.mark]
  );

  const grade = useMemo(() => {
    if (!state.determined || !state.group || !state.mark || !state.sortament) return null;
    return findGrade(handbook, state.group, state.mark, state.sortament) ?? null;
  }, [handbook, state]);

  const pickerResults = useMemo(() => {
    const q = pickerQ.trim().toLowerCase();
    if (q.length < 2) return [];
    return handbook.grades
      .filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.mark?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 12);
  }, [handbook, pickerQ]);

  const applyGrade = (g: SteelGrade) => {
    onChange({
      group: g.group ?? "",
      mark: displayMark(g),
      sortament: extractSortament(g.name),
      determined: false,
    });
    setPickerOpen(false);
    setPickerQ("");
  };

  const canDetermine =
    Boolean(state.group && state.mark && state.sortament) &&
    state.temperature !== undefined;

  const filledCount = [state.group, state.mark, state.sortament].filter(Boolean).length;

  const copyVal = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 transition-shadow",
        state.determined && grade
          ? "border-emerald-500/30 shadow-lg shadow-emerald-500/5"
          : "border-[var(--color-border)]"
      )}
    >
      <CardHeader className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {index === 0 ? "Подбор свойств стали" : `Подбор ${index + 1}`}
              </CardTitle>
              <CardDescription className="mt-0.5">
                Шаги 1 → 4, затем нажмите «Определить»
              </CardDescription>
            </div>
          </div>
          {canRemove && onRemove && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-[var(--color-destructive)]/40 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-1">
          {[1, 2, 3, 4].map((n) => {
            const done =
              n === 1
                ? !!state.group
                : n === 2
                  ? !!state.mark
                  : n === 3
                    ? !!state.sortament
                    : state.temperature !== undefined;
            const current =
              (n === 1 && !state.group) ||
              (n === 2 && state.group && !state.mark) ||
              (n === 3 && state.mark && !state.sortament) ||
              (n === 4 && state.sortament && !state.determined);
            return (
              <div key={n} className="flex flex-1 items-center gap-1">
                <div
                  className={cn(
                    "flex h-7 flex-1 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                    done && "bg-emerald-500/25 text-emerald-400",
                    current && !done && "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
                    !done && !current && "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </div>
                {n < 4 && (
                  <ArrowRight className="h-3 w-3 shrink-0 text-[var(--color-muted-foreground)]/50" />
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-[var(--color-muted-foreground)]">
          Заполнено {filledCount} из 3 обязательных полей
          {state.sortament ? " · температура выбрана" : ""}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {/* Quick search */}
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium transition-colors",
            pickerOpen
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-accent)]"
          )}
        >
          <Search className="h-4 w-4" />
          {pickerOpen ? "Скрыть быстрый поиск" : "Быстрый поиск марки (12Х18Н10Т, 09Г2С…)"}
        </button>

        {pickerOpen && (
          <div className="rounded-xl border-2 border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-primary)]" />
              <Input
                className="h-11 border-2 pl-10 text-base"
                placeholder="Начните вводить марку…"
                value={pickerQ}
                onChange={(e) => setPickerQ(e.target.value)}
                autoFocus
              />
            </div>
            <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto">
              {pickerResults.length === 0 ? (
                <li className="rounded-lg px-3 py-4 text-center text-sm text-[var(--color-muted-foreground)]">
                  {pickerQ.length < 2
                    ? "Минимум 2 символа для поиска"
                    : "Ничего не найдено"}
                </li>
              ) : (
                pickerResults.map((g) => (
                  <li key={g.name}>
                    <button
                      type="button"
                      className="w-full rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-card)]"
                      onClick={() => applyGrade(g)}
                    >
                      <span className="text-base font-semibold text-[var(--color-primary)]">
                        {displayMark(g)}
                      </span>
                      <span className="mt-1 block text-xs leading-snug text-[var(--color-muted-foreground)]">
                        {g.group} · {extractSortament(g.name)}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        <p className="text-center text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          или выберите по шагам
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectStep
            step={1}
            title="Тип стали"
            hint="Группа по ПНАЭ: углеродистая, легированная…"
            icon={Layers}
            status={stepStatus(!!state.group, false, !state.group)}
          >
            <StyledSelect
              hasValue={!!state.group}
              placeholder="Выберите тип стали"
              value={state.group}
              onChange={(e) =>
                onChange({
                  group: e.target.value,
                  mark: "",
                  sortament: "",
                  determined: false,
                })
              }
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </StyledSelect>
          </SelectStep>

          <SelectStep
            step={2}
            title="Марка стали"
            hint={state.group ? `${marks.length} марок в группе` : "Сначала выберите тип"}
            icon={Tag}
            status={stepStatus(!!state.mark, !state.group, !!state.group && !state.mark)}
          >
            <StyledSelect
              hasValue={!!state.mark}
              placeholder="Выберите марку"
              value={state.mark}
              disabled={!state.group}
              onChange={(e) =>
                onChange({ mark: e.target.value, sortament: "", determined: false })
              }
            >
              {marks.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </StyledSelect>
          </SelectStep>

          <SelectStep
            step={3}
            title="Сортамент"
            hint="Вид проката и ограничения по толщине"
            icon={Package}
            status={stepStatus(
              !!state.sortament,
              !state.mark,
              !!state.mark && !state.sortament
            )}
            fullWidth
          >
            <StyledSelect
              hasValue={!!state.sortament}
              placeholder={
                state.mark
                  ? `Выберите из ${sortaments.length} вариантов`
                  : "Сначала выберите марку"
              }
              value={state.sortament}
              disabled={!state.mark}
              onChange={(e) => onChange({ sortament: e.target.value, determined: false })}
            >
              {sortaments.map((s) => (
                <option key={s.gradeName} value={s.sortament}>
                  {s.sortament}
                </option>
              ))}
            </StyledSelect>
          </SelectStep>

          <SelectStep
            step={4}
            title="Температура стенки"
            hint="Расчётная температура, °C"
            icon={Thermometer}
            status={!state.sortament ? "locked" : "done"}
          >
            <StyledSelect
              hasValue
              value={String(state.temperature)}
              disabled={!state.sortament}
              onChange={(e) =>
                onChange({ temperature: Number(e.target.value), determined: false })
              }
            >
              {handbook.temperaturesC.map((t) => (
                <option key={t} value={t}>
                  {t} °C
                </option>
              ))}
            </StyledSelect>
          </SelectStep>
        </div>

        {/* Summary before calculate */}
        {canDetermine && !state.determined && (
          <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-primary)]">
              Готово к расчёту
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              <strong>{state.mark}</strong>
              <br />
              <span className="text-[var(--color-muted-foreground)]">{state.sortament}</span>
              <br />
              <span className="text-[var(--color-muted-foreground)]">
                {state.group} · T = {state.temperature} °C
              </span>
            </p>
          </div>
        )}

        <Button
          type="button"
          size="lg"
          disabled={!canDetermine}
          className={cn(
            "h-12 w-full text-base font-semibold shadow-md",
            canDetermine && "shadow-[var(--color-primary)]/25"
          )}
          onClick={() => onChange({ determined: true })}
        >
          Определить свойства
        </Button>

        {!canDetermine && (
          <p className="text-center text-xs text-[var(--color-muted-foreground)]">
            Заполните все поля выше, чтобы активировать кнопку
          </p>
        )}

        {state.determined && grade && (
          <div className="space-y-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="h-5 w-5" />
              <span className="font-semibold">Результаты при T = {state.temperature} °C</span>
            </div>

            <div className="rounded-lg bg-[var(--color-card)] p-3 text-sm">
              <div className="text-lg font-bold text-[var(--color-primary)]">{state.mark}</div>
              <div className="mt-1 text-[var(--color-muted-foreground)]">{state.sortament}</div>
              <div className="mt-2 inline-flex rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-xs">
                {state.group} · класс {grade.classId}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MECH_PROPS.map((key) => {
                const meta = handbook.properties[key];
                if (!meta) return null;
                const val = valueAt(grade, key, state.temperature);
                const cellId = `${grade.name}-${key}`;
                return (
                  <div
                    key={key}
                    className="flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3"
                  >
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {meta.label}
                    </span>
                    <button
                      type="button"
                      className="mt-1 flex items-baseline gap-2 text-left"
                      onClick={() => val !== null && copyVal(String(val), cellId)}
                      title="Копировать"
                    >
                      <span className="text-2xl font-bold tabular-nums">
                        {val ?? "—"}
                      </span>
                      <span className="text-sm text-[var(--color-muted-foreground)]">
                        {meta.unit}
                      </span>
                      {val !== null &&
                        (copied === cellId ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 opacity-40" />
                        ))}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-emerald-500/20 pt-3">
              <Button variant="outline" size="sm" asChild>
                <Link
                  to={`/calculators/in-1-allowable-stress?rp02=${valueAt(grade, "rp02", state.temperature) ?? ""}&rm=${valueAt(grade, "rm", state.temperature) ?? ""}&temperature=${state.temperature}`}
                >
                  <Calculator className="h-4 w-4" />
                  Расчёт [σ]
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ determined: false })}
              >
                Изменить выбор
              </Button>
            </div>
          </div>
        )}

        {state.determined && !grade && (
          <p className="rounded-lg border border-[var(--color-destructive)]/50 bg-[var(--color-destructive)]/10 px-4 py-3 text-sm text-[var(--color-destructive)]">
            Не удалось найти данные для выбранной комбинации
          </p>
        )}
      </CardContent>
    </Card>
  );
}
