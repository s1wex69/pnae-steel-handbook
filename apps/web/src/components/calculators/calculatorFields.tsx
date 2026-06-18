import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CALC_ROW_GRID,
  CALC_VALUE_GRID,
  CalcSection,
  calcInputClass,
} from "@/components/calculators/calculatorUi";
import { Var } from "@/components/handbooks/MathNotation";

type RowVariant = "default" | "check" | "result";
type RowLayout = "inline" | "stacked";

function ResultValue({ value, unit }: { value: string; unit?: string }) {
  return (
    <>
      <div className="flex h-11 w-full min-w-0 max-w-[11rem] items-center justify-end rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-lg tabular-nums text-[var(--color-foreground)]">
        {value}
      </div>
      {unit ? (
        <span className="text-lg text-[var(--color-muted-foreground)]">{unit}</span>
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
  children?: ReactNode;
}) {
  const isCheck = variant === "check";
  const isResult = variant === "result";
  const isStacked = layout === "stacked" && !isCheck;

  const symbolClass = "justify-self-end text-right text-lg font-medium text-[var(--color-heading)]";
  const unitClass = "text-lg text-[var(--color-muted-foreground)]";

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
        wide || isCheck ? "sm:col-span-2" : cn(CALC_ROW_GRID, "sm:col-span-2 sm:grid-cols-subgrid"),
        "sm:items-center",
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
  expanded,
  onToggle,
  c1,
  c2,
  c31,
  c32,
  c33,
  c3,
  cc,
  onC1,
  onC2,
  onC31,
  onC32,
  onC33,
  onC3,
  onCc,
  onC3Manual,
  onCcManual,
}: {
  expanded: boolean;
  onToggle: () => void;
  c1: string;
  c2: string;
  c31: string;
  c32: string;
  c33: string;
  c3: string;
  cc: string;
  onC1: (v: string) => void;
  onC2: (v: string) => void;
  onC31: (v: string) => void;
  onC32: (v: string) => void;
  onC33: (v: string) => void;
  onC3: (v: string) => void;
  onCc: (v: string) => void;
  onC3Manual: () => void;
  onCcManual: () => void;
}) {
  return (
    <CalcSection
      title="Прибавки к расчётной толщине"
      titleAccent={false}
      collapsible
      expanded={expanded}
      onToggle={onToggle}
      details={
        <>
          <CalcRow label="Прибавка для компенсации коррозии и эрозии" symbol={<Var letter="c" sub="1" />} value={c1} onChange={(v) => { onCcManual(); onC1(v); }} unit="мм" />
          <CalcRow label="Прибавка для компенсации минусового допуска" symbol={<Var letter="c" sub="2" />} value={c2} onChange={(v) => { onCcManual(); onC2(v); }} unit="мм" />
          <CalcRow label="Технологическая прибавка (утонение с внешней стороны отвода)" symbol={<Var letter="c" sub="31" />} value={c31} onChange={(v) => { onC3Manual(); onC31(v); }} unit="мм" />
          <CalcRow label="Технологическая прибавка (утонение с внутренней стороны отвода)" symbol={<Var letter="c" sub="32" />} value={c32} onChange={(v) => { onC3Manual(); onC32(v); }} unit="мм" />
          <CalcRow label="Технологическая прибавка (средняя часть отвода, ±15° нейтральной линии)" symbol={<Var letter="c" sub="33" />} value={c33} onChange={(v) => { onC3Manual(); onC33(v); }} unit="мм" />
          <CalcRow label="Технологическая прибавка" symbol={<Var letter="c" sub="3" />} value={c3} onChange={(v) => { onC3Manual(); onC3(v); }} unit="мм" borderless />
        </>
      }
    >
      <CalcRow
        label="Сумма прибавок к расчётным толщинам стенок"
        symbol="c"
        value={cc}
        onChange={(v) => {
          onCcManual();
          onCc(v);
        }}
        unit="мм"
        borderless
      />
    </CalcSection>
  );
}
