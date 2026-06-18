import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SteelHandbook } from "@/types/steel";
import {
  computePnaeAllowable,
  displayMark,
  findCategoryIdForMark,
  findGrade,
  getAllMarks,
  getAllPnaeGroups,
  getSortamentsInGroups,
  groupsFromCategoryId,
  interpolatedValue,
} from "@/lib/steelHandbook";
import { MarkCombobox } from "@/components/handbooks/MarkCombobox";
import { StyledSelect } from "@/components/handbooks/SelectStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SigmaStandard = "pnae" | "gost";

interface Props {
  handbook: SteelHandbook;
  value: string;
  onChange: (sigma: number) => void;
  className?: string;
  /** Встроено в калькулятор — без отдельной рамки */
  embedded?: boolean;
  /** Только выбор сортамента и температуры (значение [σ] — снаружи) */
  pickersOnly?: boolean;
  /** Вертикальная раскладка полей (для узкой колонки) */
  stacked?: boolean;
  /** Сортамент и поиск марки скрыты до нажатия «Раскрыть» */
  collapsibleSteelPickers?: boolean;
  /** Температура вводится снаружи (под полем [σ]) */
  externalTemperature?: boolean;
  temperature?: string;
  onTemperatureChange?: (t: string) => void;
}
function StandardToggle({
  standard,
  onChange,
}: {
  standard: SigmaStandard;
  onChange: (s: SigmaStandard) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex cursor-pointer items-center gap-2 text-base font-medium text-[var(--color-heading)]">
        <input
          type="checkbox"
          checked={standard === "pnae"}
          onChange={() => onChange("pnae")}
        />
        ПНАЭ
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-base font-medium text-[var(--color-heading)]">
        <input
          type="checkbox"
          checked={standard === "gost"}
          onChange={() => onChange("gost")}
        />
        ГОСТ
      </label>
    </div>
  );
}

function SteelPickersToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 text-base font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-heading)]"
    >
      {expanded ? (
        <>
          <ChevronUp className="h-5 w-5" />
          Скрыть
        </>
      ) : (
        <>
          <ChevronDown className="h-5 w-5" />
          Раскрыть
        </>
      )}
    </button>
  );
}

export function AllowableStressFromHandbook({
  handbook,
  value,
  onChange,
  className,
  embedded,
  pickersOnly,
  stacked,
  collapsibleSteelPickers = false,
  externalTemperature = false,
  temperature: temperatureProp,
  onTemperatureChange,
}: Props) {
  const [standard, setStandard] = useState<SigmaStandard>("pnae");
  const [steelExpanded, setSteelExpanded] = useState(!collapsibleSteelPickers);
  const [mark, setMark] = useState("");
  const [sortament, setSortament] = useState("");
  const [group, setGroup] = useState("");
  const [temperatureInternal, setTemperatureInternal] = useState("20");
  const temperature = temperatureProp ?? temperatureInternal;
  const setTemperature = onTemperatureChange ?? setTemperatureInternal;
  const [manual, setManual] = useState(value || "130");

  const marks = useMemo(() => getAllMarks(handbook), [handbook]);
  const activeMark = marks.includes(mark) ? mark : "";

  const categoryId = activeMark ? (findCategoryIdForMark(handbook, activeMark) ?? "") : "";
  const sortOpts = useMemo(() => {
    if (!activeMark) return [];
    const groups = categoryId ? groupsFromCategoryId(categoryId) : getAllPnaeGroups();
    return getSortamentsInGroups(handbook, groups, activeMark);
  }, [handbook, activeMark, categoryId]);

  const showSteelPickers = !collapsibleSteelPickers || steelExpanded;
  const hasSteelSelection = Boolean(activeMark && sortament && group);

  const handbookSigma = useMemo(() => {
    if (standard !== "pnae" || !hasSteelSelection) return null;
    const grade = findGrade(handbook, group, activeMark, sortament);
    if (!grade) return null;

    const catId = findCategoryIdForMark(handbook, displayMark(grade)) ?? "";
    const t = Number(temperature.replace(",", "."));
    if (!Number.isFinite(t)) return null;
    const rm = interpolatedValue(grade, "rm", t);
    const rp02 = interpolatedValue(grade, "rp02", t);
    if (rm == null || rp02 == null || rm <= 0 || rp02 <= 0 || rp02 > rm) return null;
    const allow = computePnaeAllowable(rm, rp02, {
      temperature: t,
      materialGroup: grade.group,
      categoryId: catId,
    });
    return allow?.sigma ?? null;
  }, [handbook, standard, hasSteelSelection, group, activeMark, sortament, temperature]);

  useEffect(() => {
    if (standard !== "pnae" || handbookSigma == null) return;
    if (!pickersOnly) setManual(String(handbookSigma));
    onChange(handbookSigma);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync σ when handbook selection changes
  }, [handbookSigma, pickersOnly, standard]);

  useEffect(() => {
    if (!activeMark) return;
    const match = sortOpts.find((o) => o.sortament === sortament) ?? sortOpts[0];
    if (match) {
      setSortament(match.sortament);
      setGroup(match.group);
    } else {
      setSortament("");
      setGroup("");
    }
  }, [activeMark, sortOpts, sortament]);

  useEffect(() => {
    if (!pickersOnly) setManual(value || "130");
  }, [value, pickersOnly]);

  const fieldLabelClass = embedded ? "text-base" : "text-sm";

  const markField = (
    <div className="space-y-1.5">
      <Label className={fieldLabelClass}>Марка стали</Label>
      <MarkCombobox
        handbook={handbook}
        value={mark}
        onChange={setMark}
        placeholder="Поиск марки…"
        className={embedded ? "[&_input]:h-12 [&_input]:text-base" : undefined}
      />
    </div>
  );

  const sortamentField = (
    <div className="min-w-0 space-y-1.5">
      <Label className={fieldLabelClass}>Сортамент</Label>
      <StyledSelect
        hasValue={!!sortament}
        placeholder={activeMark ? "Выберите сортамент" : "Сначала выберите марку"}
        value={sortament}
        disabled={!activeMark}
        className={embedded ? "h-12 text-base" : undefined}
        onChange={(e) => {
          const s = e.target.value;
          const match = sortOpts.find((o) => o.sortament === s);
          setSortament(s);
          setGroup(match?.group ?? "");
        }}
      >
        {sortOpts.map((s) => (
          <option key={s.gradeName} value={s.sortament}>
            {s.sortament}
          </option>
        ))}
      </StyledSelect>
    </div>
  );

  const temperatureField = !externalTemperature ? (
    <div className="space-y-1.5">
      <Label className={fieldLabelClass}>T, °C</Label>
      <Input
        type="text"
        inputMode="decimal"
        className={cn(embedded && "h-10 w-[6rem] text-right text-base tabular-nums")}
        value={temperature}
        disabled={!hasSteelSelection}
        onChange={(e) => setTemperature(e.target.value.replace(",", "."))}
      />
    </div>
  ) : null;

  const pnaePickers = (
    <div className="grid gap-2">
      {collapsibleSteelPickers && (
        <SteelPickersToggle expanded={steelExpanded} onToggle={() => setSteelExpanded((v) => !v)} />
      )}
      {showSteelPickers ? (
        <>
          {markField}
          {externalTemperature ? sortamentField : (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              {sortamentField}
              {temperatureField}
            </div>
          )}
        </>
      ) : (
        !externalTemperature && <div className="flex justify-end">{temperatureField}</div>
      )}
    </div>
  );

  const pickers = stacked ? (
    <div className="grid gap-2">
      <StandardToggle standard={standard} onChange={setStandard} />
      {standard === "pnae" && pnaePickers}
    </div>
  ) : (
    <div
      className={cn(
        "flex flex-wrap items-end gap-2",
        embedded && pickersOnly && "w-full min-w-0"
      )}
    >
      <div className="w-full">
        <StandardToggle standard={standard} onChange={setStandard} />
      </div>
      {standard === "pnae" && (
        <>
          {pnaePickers}
          {!pickersOnly && (
            <div className="space-y-1">
              <Label className="text-sm">[σ], МПа</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={manual}
                onChange={(e) => {
                  const raw = e.target.value.replace(",", ".");
                  setManual(raw);
                  const n = Number(raw);
                  if (Number.isFinite(n) && n > 0) onChange(n);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  if (embedded && pickersOnly) {
    return <div className={className}>{pickers}</div>;
  }

  return (
    <div
      className={cn(
        "space-y-2",
        !embedded && "space-y-3",
        !embedded && "rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/45 p-3",
        className
      )}
    >
      {!embedded && (
        <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
          Из справочника или вручную
        </p>
      )}
      <div className={cn("grid gap-2", embedded ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2")}>
        {pickers}
      </div>
    </div>
  );
}
