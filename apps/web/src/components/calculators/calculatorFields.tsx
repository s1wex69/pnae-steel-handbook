import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CALC_ROW_GRID,
  CALC_ROW_GRID_IN_COLUMN,
  CALC_VALUE_GRID,
  CALC_VALUE_GRID_NO_SYMBOL,
  CALC_VALUE_GRID_WIDE,
  CALC_SECTION_CARD,
  CALC_SYMBOL_CLASS,
  CalcSection,
  CalcSectionHeading,
  calcInputClass,
  calcResultBoxClass,
} from "@/components/calculators/calculatorUi";
import { CalcSymbol, Var, AllowanceC } from "@/components/handbooks/MathNotation";

type RowVariant = "default" | "check" | "result";
type RowLayout = "inline" | "stacked";

function normalizeRowSymbol(symbol: ReactNode): ReactNode {
  if (symbol == null || symbol === "") return symbol;
  if (typeof symbol === "string") {
    const s = symbol.trim();
    if (s.startsWith("[") && s.endsWith("]")) return <CalcSymbol>{s}</CalcSymbol>;
    if (s.length === 1) return <Var letter={s} />;
    return <CalcSymbol>{s}</CalcSymbol>;
  }
  return symbol;
}

function ResultValue({ value, unit }: { value: string; unit?: string }) {
  return (
    <>
      <div className={calcResultBoxClass}>
        {value}
      </div>
      {unit ? (
        <span className="text-sm text-[var(--color-muted-foreground)]">{unit}</span>
      ) : (
        <span />
      )}
    </>
  );
}

export function CalcRow({
  label,
  labelExtra,
  variant = "default",
  layout = "inline",
  unit,
  symbol,
  value,
  onChange,
  onFocus,
  disabled,
  wide,
  wideValue = false,
  borderless,
  inColumn = false,
  /** Подпись и поле ввода в одной строке; labelExtra — только под текстом слева */
  inlineLabelExtra = false,
  children,
}: {
  label: string;
  labelExtra?: ReactNode;
  variant?: RowVariant;
  layout?: RowLayout;
  unit?: string;
  symbol?: ReactNode;
  value?: string;
  onChange?: (v: string) => void;
  onFocus?: () => void;
  disabled?: boolean;
  wide?: boolean;
  /** Широкая ячейка значения (несколько чисел, длинный результат) */
  wideValue?: boolean;
  borderless?: boolean;
  inColumn?: boolean;
  inlineLabelExtra?: boolean;
  children?: ReactNode;
}) {
  const isCheck = variant === "check";
  const isResult = variant === "result";
  const hasSymbol = symbol != null && symbol !== "";
  const displaySymbol = hasSymbol ? normalizeRowSymbol(symbol) : null;
  const forceStacked = layout === "stacked" || (Boolean(labelExtra) && !inlineLabelExtra);
  const isStacked = (forceStacked && !isCheck) || (inColumn && Boolean(labelExtra) && !inlineLabelExtra);

  const symbolClass = CALC_SYMBOL_CLASS;
  const unitClass = "shrink-0 text-sm text-[var(--color-muted-foreground)]";

  const valueGridClass = cn(
    !hasSymbol
      ? CALC_VALUE_GRID_NO_SYMBOL
      : wideValue
        ? CALC_VALUE_GRID_WIDE
        : CALC_VALUE_GRID,
    isCheck && "mt-1",
    isStacked && "justify-self-stretch xl:justify-self-end"
  );

  const valueBlock = children ? (
    <div className={cn(isCheck ? "mt-2 justify-self-start" : "min-w-0 justify-self-end")}>{children}</div>
  ) : (
    <div className={valueGridClass}>
      {hasSymbol ? <span className={symbolClass}>{displaySymbol}</span> : null}
      {isResult && disabled ? (
        <ResultValue value={value ?? "—"} unit={unit} />
      ) : (
        <>
          <Input
            type="text"
            inputMode="decimal"
            className={calcInputClass}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value.replace(",", "."))}
            onFocus={onFocus}
          />
          {unit ? <span className={unitClass}>{unit}</span> : <span />}
        </>
      )}
    </div>
  );

  const labelBlock = (
    <div
      className={cn(
        "min-w-0 text-base leading-snug text-[var(--color-foreground)] [overflow-wrap:break-word]",
        isCheck && "font-medium text-[var(--color-heading)]"
      )}
    >
      {label ? <div>{label}</div> : null}
      {labelExtra}
    </div>
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-4 py-2",
        inColumn
          ? cn(
              CALC_ROW_GRID_IN_COLUMN,
              "min-w-0 sm:col-span-2",
              !isStacked && (inlineLabelExtra ? "xl:items-start" : "xl:items-center")
            )
          : wide || isCheck
            ? "sm:col-span-2"
            : cn(CALC_ROW_GRID, "sm:col-span-2 sm:grid-cols-subgrid"),
        !inColumn && !isStacked && "sm:items-center",
        !borderless && !isCheck && "border-b border-[var(--color-border)]/50 last:border-b-0"
      )}
    >
      {isStacked ? (
        <div className="space-y-2 sm:col-span-2">
          {labelBlock}
          {valueBlock}
        </div>
      ) : (
        <>
          {labelBlock}
          {!isCheck && valueBlock}
          {isCheck && valueBlock}
        </>
      )}
    </div>
  );
}

export function AllowancesCalcSection({
  c1,
  c2,
  c3,
  cc,
  onC1,
  onC2,
  onC3,
  onCc,
  ccSymbol = <CalcSymbol>c</CalcSymbol>,
  collapsible = true,
  defaultExpanded = true,
}: {
  c1: string;
  c2: string;
  c3: string;
  cc: string;
  onC1: (v: string) => void;
  onC2: (v: string) => void;
  onC3: (v: string) => void;
  onCc: (v: string) => void;
  ccSymbol?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleButton = collapsible ? (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-heading)]"
    >
      {expanded ? (
        <>
          <ChevronUp className="h-4 w-4" />
          Скрыть
        </>
      ) : (
        <>
          <ChevronDown className="h-4 w-4" />
          Раскрыть
        </>
      )}
    </button>
  ) : null;

  if (collapsible) {
    return (
      <section className={CALC_SECTION_CARD}>
        <CalcSectionHeading
          title="Прибавки к расчётной толщине"
          action={toggleButton}
          accent={false}
        />
        <div className={cn("grid grid-cols-1", CALC_ROW_GRID, "sm:gap-x-6")}>
          <div className="contents">
            {expanded ? (
              <>
                <CalcRow
                  label="Прибавка для компенсации коррозии и эрозии"
                  symbol={<Var letter="c" sub="1" />}
                  value={c1}
                  onChange={onC1}
                  unit="мм"
                />
                <CalcRow
                  label="Прибавка для компенсации минусового допуска"
                  symbol={<Var letter="c" sub="2" />}
                  value={c2}
                  onChange={onC2}
                  unit="мм"
                />
                <CalcRow
                  label="Сумма технологических прибавок"
                  symbol={<Var letter="c" sub="3" />}
                  value={c3}
                  onChange={onC3}
                  unit="мм"
                />
              </>
            ) : null}
            <CalcRow
              label="Сумма прибавок к расчётным толщинам стенок"
              symbol={ccSymbol}
              value={cc}
              onChange={onCc}
              unit="мм"
              borderless
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <CalcSection title="Прибавки к расчётной толщине" titleAccent={false}>
      <CalcRow label="Прибавка для компенсации коррозии и эрозии" symbol={<Var letter="c" sub="1" />} value={c1} onChange={onC1} unit="мм" />
      <CalcRow label="Прибавка для компенсации минусового допуска" symbol={<Var letter="c" sub="2" />} value={c2} onChange={onC2} unit="мм" />
      <CalcRow label="Сумма технологических прибавок" symbol={<Var letter="c" sub="3" />} value={c3} onChange={onC3} unit="мм" />
      <CalcRow
        label="Сумма прибавок к расчётным толщинам стенок"
        symbol={ccSymbol}
        value={cc}
        onChange={onCc}
        unit="мм"
        borderless
      />
    </CalcSection>
  );
}

export function PipeAllowancesCalcSection({
  cMinus,
  cCorrosion,
  cc,
  onCMinus,
  onCCorrosion,
  onCc,
  collapsible = true,
  defaultExpanded = true,
}: {
  cMinus: string;
  cCorrosion: string;
  cc: string;
  onCMinus: (v: string) => void;
  onCCorrosion: (v: string) => void;
  onCc: (v: string) => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleButton = collapsible ? (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-heading)]"
    >
      {expanded ? (
        <>
          <ChevronUp className="h-4 w-4" />
          Скрыть
        </>
      ) : (
        <>
          <ChevronDown className="h-4 w-4" />
          Раскрыть
        </>
      )}
    </button>
  ) : null;

  const detailRows = (
    <>
      <CalcRow
        label="Минусовой допуск к толщине"
        symbol={<Var letter="c" sub="1" />}
        value={cMinus}
        onChange={onCMinus}
        unit="мм"
      />
      <CalcRow
        label="Прибавка на коррозию"
        symbol={<Var letter="c" sub="2" />}
        value={cCorrosion}
        onChange={onCCorrosion}
        unit="мм"
      />
    </>
  );

  const sumRow = (
    <CalcRow
      label="Суммарная прибавка"
      symbol={<CalcSymbol>c</CalcSymbol>}
      value={cc}
      onChange={onCc}
      unit="мм"
      borderless
    />
  );

  if (collapsible) {
    return (
      <section className={CALC_SECTION_CARD}>
        <CalcSectionHeading title="Прибавки к расчётной толщине" action={toggleButton} accent={false} />
        <div className={cn("grid grid-cols-1", CALC_ROW_GRID, "sm:gap-x-6")}>
          <div className="contents">
            {expanded ? detailRows : null}
            {sumRow}
          </div>
        </div>
      </section>
    );
  }

  return (
    <CalcSection title="Прибавки к расчётной толщине" titleAccent={false}>
      {detailRows}
      {sumRow}
    </CalcSection>
  );
}

export function ElbowAllowancesCalcSection({
  c11,
  c12,
  c21,
  onC11,
  onC12,
  onC21,
  collapsible = true,
  defaultExpanded = true,
}: {
  c11: string;
  c12: string;
  c21: string;
  onC11: (v: string) => void;
  onC12: (v: string) => void;
  onC21: (v: string) => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleButton = collapsible ? (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-heading)]"
    >
      {expanded ? (
        <>
          <ChevronUp className="h-4 w-4" />
          Скрыть
        </>
      ) : (
        <>
          <ChevronDown className="h-4 w-4" />
          Раскрыть
        </>
      )}
    </button>
  ) : null;

  const rows = (
    <>
      <CalcRow
        label="Минусовой допуск к толщине"
        symbol={<AllowanceC index="11" />}
        value={c11}
        onChange={onC11}
        unit="мм"
      />
      <CalcRow
        label="Утонение при изготовлении"
        symbol={<AllowanceC index="12" />}
        value={c12}
        onChange={onC12}
        unit="мм"
      />
      <CalcRow
        label="Прибавка на коррозию"
        symbol={<AllowanceC index="21" />}
        value={c21}
        onChange={onC21}
        unit="мм"
        borderless
      />
    </>
  );

  if (collapsible) {
    return (
      <section className={CALC_SECTION_CARD}>
        <CalcSectionHeading title="Прибавки к расчётной толщине" action={toggleButton} accent={false} />
        <div className={cn("grid grid-cols-1", CALC_ROW_GRID, "sm:gap-x-6")}>
          <div className="contents">{expanded ? rows : null}</div>
        </div>
      </section>
    );
  }

  return (
    <CalcSection title="Прибавки к расчётной толщине" titleAccent={false}>
      {rows}
    </CalcSection>
  );
}
