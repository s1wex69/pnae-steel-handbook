import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CALC_ROW_GRID,
  CALC_VALUE_GRID,
  CALC_SECTION_CARD,
  CalcSection,
  CalcSectionHeading,
  calcInputClass,
  calcResultBoxClass,
} from "@/components/calculators/calculatorUi";
import { CalcSymbol } from "@/components/handbooks/MathNotation";

type RowVariant = "default" | "check" | "result";
type RowLayout = "inline" | "stacked";

function ResultValue({ value, unit }: { value: string; unit?: string }) {
  return (
    <>
      <div className={calcResultBoxClass}>
        {value}
      </div>
      {unit ? (
        <span className="text-base text-[var(--color-muted-foreground)]">{unit}</span>
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
  borderless,
  inColumn = false,
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
  borderless?: boolean;
  inColumn?: boolean;
  children?: ReactNode;
}) {
  const isCheck = variant === "check";
  const isResult = variant === "result";
  const isStacked = layout === "stacked" && !isCheck;

  const symbolClass = "justify-self-end text-right text-base font-medium text-[var(--color-heading)]";
  const unitClass = "text-base text-[var(--color-muted-foreground)]";

  const valueBlock = children ? (
    <div className={cn(isCheck ? "mt-2 justify-self-start" : "justify-self-end")}>{children}</div>
  ) : (
    <div className={cn(CALC_VALUE_GRID, isCheck && "mt-1")}>
      {symbol ? <span className={symbolClass}>{symbol}</span> : <span />}
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

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 py-3",
        inColumn
          ? cn(CALC_ROW_GRID, "sm:items-center")
          : wide || isCheck
            ? "sm:col-span-2"
            : cn(CALC_ROW_GRID, "sm:col-span-2 sm:grid-cols-subgrid"),
        !inColumn && "sm:items-center",
        !borderless && !isCheck && "border-b border-[var(--color-border)]/50 last:border-b-0"
      )}
    >
      {isStacked ? (
        <div className="space-y-1.5 sm:col-span-2">
          <div className="text-lg leading-snug text-[var(--color-foreground)]">{label}</div>
          {valueBlock}
        </div>
      ) : (
        <>
          <div
            className={cn(
              "min-w-0 text-lg leading-snug text-[var(--color-foreground)]",
              isCheck && "font-medium text-[var(--color-heading)]"
            )}
          >
            {label ? <div>{label}</div> : null}
            {labelExtra}
          </div>
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
  ccSymbol = <CalcSymbol>cc</CalcSymbol>,
  collapsible = false,
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
  ) : null;

  if (collapsible) {
    return (
      <section className={CALC_SECTION_CARD}>
        <CalcSectionHeading
          title="Прибавки к расчётной толщине"
          action={toggleButton}
          accent={false}
        />
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_11rem] sm:gap-x-6">
          <div className="contents">
            {expanded ? (
              <>
                <CalcRow
                  label="Прибавка для компенсации коррозии и эрозии"
                  symbol={<CalcSymbol>c1</CalcSymbol>}
                  value={c1}
                  onChange={onC1}
                  unit="мм"
                />
                <CalcRow
                  label="Прибавка для компенсации минусового допуска"
                  symbol={<CalcSymbol>c2</CalcSymbol>}
                  value={c2}
                  onChange={onC2}
                  unit="мм"
                />
                <CalcRow
                  label="Сумма технологических прибавок"
                  symbol={<CalcSymbol>c3</CalcSymbol>}
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
      <CalcRow label="Прибавка для компенсации коррозии и эрозии" symbol={<CalcSymbol>c1</CalcSymbol>} value={c1} onChange={onC1} unit="мм" />
      <CalcRow label="Прибавка для компенсации минусового допуска" symbol={<CalcSymbol>c2</CalcSymbol>} value={c2} onChange={onC2} unit="мм" />
      <CalcRow label="Сумма технологических прибавок" symbol={<CalcSymbol>c3</CalcSymbol>} value={c3} onChange={onC3} unit="мм" />
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
