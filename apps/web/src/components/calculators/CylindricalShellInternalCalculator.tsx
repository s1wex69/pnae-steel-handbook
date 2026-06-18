import { useEffect, useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  calculateCylindricalShellInternal,
  checkApplicability,
  type ShellSolveTarget,
} from "@/lib/cylindricalShellInternal";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import {
  CALC_ROW_GRID,
  CALC_VALUE_GRID,
  CalcSection,
  CalculatorDiagramCard,
  CalculatorPageHeader,
  CalculatorPageShell,
  calcInputClass,
} from "@/components/calculators/calculatorUi";
import { ShellApplicabilityLimit } from "@/components/calculators/ShellInternalFormulas";
import { VesselDiagram } from "@/components/calculators/VesselDiagram";
import { AllowSigma, Frac, Var } from "@/components/handbooks/MathNotation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmt, fmtIfSource, isBlank, num, sumFmt } from "@/lib/calcInputUtils";

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

function CalcRow({
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
  dMm,
  wide,
  borderless,
  children,
}: {
  label: string;
  labelExtra?: React.ReactNode;
  variant?: RowVariant;
  layout?: RowLayout;
  unit?: string;
  symbol?: React.ReactNode;
  value?: string;
  onChange?: (v: string) => void;
  onFocus?: () => void;
  disabled?: boolean;
  dMm?: number;
  wide?: boolean;
  borderless?: boolean;
  children?: React.ReactNode;
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
          <div
            className={cn(
              "text-lg leading-snug text-[var(--color-foreground)]"
            )}
          >
            {label}
          </div>
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
            {isCheck && dMm != null && (
              <div className="mt-1 font-normal">
                <ShellApplicabilityLimit dMm={dMm} />
              </div>
            )}
          </div>
          {!isCheck && valueBlock}
          {isCheck && valueBlock}
        </>
      )}
    </div>
  );
}


export function CylindricalShellInternalCalculator({
  handbook,
}: {
  handbook: SteelHandbook;
}) {
  const [c1, setC1] = useState("0.2");
  const [c2, setC2] = useState("0.2");
  const [c3, setC3] = useState("0.3");
  const [cc, setCc] = useState("0.7");
  const [ccManual, setCcManual] = useState(false);
  const [D, setD] = useState("2000");
  const [sigmaStr, setSigmaStr] = useState("130");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigma = num(sigmaStr, 130);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("10");
  const [sp, setSp] = useState("80");
  const [drive, setDrive] = useState<ShellSolveTarget>("p");
  const [ss, setSs] = useState("");
  const [allowancesExpanded, setAllowancesExpanded] = useState(false);

  const solveFor: ShellSolveTarget = drive === "p" ? "sp" : "p";
  const ccNum = num(cc);
  const dNum = num(D);

  useEffect(() => {
    if (ccManual) return;
    setCc(sumFmt([c1, c2, c3]));
  }, [c1, c2, c3, ccManual]);

  const result = useMemo(
    () =>
      calculateCylindricalShellInternal({
        D: num(D),
        sigma,
        phiP: num(phiP, 1),
        p: num(p),
        sp: num(sp),
        solveFor,
        allowances: {
          c1: num(c1),
          c2: num(c2),
          c31: 0,
          c32: 0,
          c33: 0,
          c3: num(c3),
          cc: num(cc),
        },
      }),
    [c1, c2, c3, cc, D, sigma, phiP, p, sp, solveFor]
  );

  const driveThicknessRaw = drive === "p" ? p : sp;
  const thicknessInputBlank = isBlank(driveThicknessRaw);

  const displayP = drive === "p" ? p : fmtIfSource(result.p, sp, 2);
  const displaySp = drive === "sp" ? sp : fmtIfSource(result.sp, p);

  const effectiveSs = useMemo(() => {
    if (thicknessInputBlank) return 0;
    if (!isBlank(ss)) return num(ss);
    return result.ss;
  }, [ss, result.ss, thicknessInputBlank]);

  const displaySs = isBlank(ss) ? (thicknessInputBlank ? "" : fmt(result.ss)) : ss;

  const applicability = useMemo(
    () => checkApplicability(effectiveSs - ccNum, dNum),
    [effectiveSs, ccNum, dNum]
  );

  const activateP = () => {
    if (drive !== "p") {
      setDrive("p");
      if (result.error == null && !isBlank(sp)) setP(fmt(result.p, 2));
    }
  };

  const activateSp = () => {
    if (drive !== "sp") {
      setDrive("sp");
      if (result.error == null && !isBlank(p)) setSp(fmt(result.sp));
    }
  };

  const activateSs = () => {
    if (isBlank(ss) && !thicknessInputBlank) setSs(fmt(result.ss));
  };

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader
        eyebrow="Калькулятор"
        title="Расчёт на прочность цилиндрической обечайки при внутреннем избыточном давлении"
        standard="по ГОСТ 34233.2-2017"
      />

      <section className="space-y-8">
        <CalcSection
            title="Прибавки к расчётной толщине"
            titleAccent={false}
            collapsible
            expanded={allowancesExpanded}
            onToggle={() => setAllowancesExpanded((v) => !v)}
            details={
              <>
                <CalcRow label="Прибавка для компенсации коррозии и эрозии" symbol={<Var letter="c" sub="1" />} value={c1} onChange={(v) => { setCcManual(false); setC1(v); }} unit="мм" />
                <CalcRow label="Прибавка для компенсации минусового допуска" symbol={<Var letter="c" sub="2" />} value={c2} onChange={(v) => { setCcManual(false); setC2(v); }} unit="мм" />
                <CalcRow
                  label="Технологические прибавки"
                  symbol={<Var letter="c" sub="3" />}
                  value={c3}
                  onChange={(v) => {
                    setCcManual(false);
                    setC3(v);
                  }}
                  unit="мм"
                  borderless
                />
              </>
            }
          >
            <CalcRow
              label="Сумма прибавок к расчётным толщинам стенок"
              symbol="c"
              value={cc}
              onChange={(v) => {
                setCcManual(true);
                setCc(v);
              }}
              unit="мм"
              borderless
            />
          </CalcSection>

          <CalcSection title="Исходные данные" titleAccent={false}>
            <CalcRow label="Внутренний диаметр сосуда или аппарата" symbol="D" value={D} onChange={setD} unit="мм" />
            <CalcRow
              label="Расчётное внутреннее избыточное давление"
              symbol="p"
              value={displayP}
              onFocus={activateP}
              onChange={(v) => {
                setDrive("p");
                setP(v);
              }}
              unit="МПа"
            />
            <CalcRow
              label="Допускаемое напряжение при расчётной температуре"
              labelExtra={
                <div className="mt-1.5">
                  <AllowableStressFromHandbook
                    handbook={handbook}
                    value={sigmaStr}
                    onChange={(n) => setSigmaStr(String(n))}
                    embedded
                    pickersOnly
                    stacked
                    collapsibleSteelPickers
                    externalTemperature
                    temperature={sigmaTemp}
                    onTemperatureChange={setSigmaTemp}
                  />
                </div>
              }
              symbol={<AllowSigma />}
              value={sigmaStr}
              onChange={setSigmaStr}
              unit="МПа"
            />
            <CalcRow
              label="Температура"
              symbol="T"
              value={sigmaTemp}
              onChange={setSigmaTemp}
              unit="°C"
            />
            <CalcRow
              label="Коэффициент прочности продольного сварного шва"
              symbol={<Var letter="φ" sub="p" />}
              value={phiP}
              onChange={setPhiP}
              borderless
            />
          </CalcSection>

          <CalcSection title="Результаты расчёта" titleAccent={false}>
            <CalcRow
              label="Расчётная толщина стенки цилиндрической обечайки"
              symbol={<Var letter="s" sub="p" />}
              value={displaySp}
              onFocus={activateSp}
              onChange={(v) => {
                setDrive("sp");
                setSp(v);
              }}
              unit="мм"
            />
            <CalcRow
              label="Исполнительная толщина стенки цилиндрической обечайки"
              symbol="s"
              value={displaySs}
              onFocus={activateSs}
              onChange={setSs}
              unit="мм"
              borderless
            />
          </CalcSection>

          <CalcSection title="Проверка применимости" titleAccent={false}>
            <CalcRow label="Проверка применимости расчётной методики" variant="check" dMm={num(D)} borderless>
            <span
              className={cn(
                "inline-flex w-full flex-wrap items-center justify-start gap-x-2 text-xl font-semibold tabular-nums",
                applicability.ok
                  ? "text-[var(--color-emphasis)]"
                  : "text-[var(--color-destructive)]"
              )}
            >
              <Frac num={<>s − c</>} den="D" />
              <span>= {fmt(applicability.ratio, 3)}</span>
              <span>
                {applicability.ok ? "≤" : ">"} {applicability.limit} —{" "}
                {applicability.ok ? "выполнено" : "не выполнено"}
              </span>
            </span>
            </CalcRow>
          </CalcSection>
      </section>

      {result.error ? (
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-6 py-4 text-lg text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : null}

      <CalculatorDiagramCard>
        <VesselDiagram diameter={dNum || 2000} thickness={effectiveSs || num(sp, 80)} />
      </CalculatorDiagramCard>
    </CalculatorPageShell>
  );
}
