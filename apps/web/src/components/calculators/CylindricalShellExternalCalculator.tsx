import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  calculateCylindricalShellExternal,
  calcPpFromSp,
  calcSpFromAllowablePp,
  type ExternalShellSolveTarget,
} from "@/lib/cylindricalShellExternal";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { AllowancesCalcSection } from "@/components/calculators/calculatorFields";
import {
  CALC_ROW_GRID,
  CALC_VALUE_GRID,
  CalcSection,
  CalculatorDiagramCard,
  CalculatorPageHeader,
  CalculatorPageShell,
  CALC_RESULT_SP_SYMBOL,
  calcInputClass,
} from "@/components/calculators/calculatorUi";
import { VesselDiagram } from "@/components/calculators/VesselDiagram";
import { AllowSigma, Var, CALC_NOTATION_CLASS } from "@/components/handbooks/MathNotation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { fmt, fmtIfSource, isBlank, num } from "@/lib/calcInputUtils";

type RowVariant = "default" | "result";

function CalcRow({
  label,
  labelExtra,
  variant = "default",
  unit,
  symbol,
  value,
  onChange,
  onFocus,
  borderless,
}: {
  label: string;
  labelExtra?: React.ReactNode;
  variant?: RowVariant;
  unit?: string;
  symbol?: React.ReactNode;
  value?: string;
  onChange?: (v: string) => void;
  onFocus?: () => void;
  borderless?: boolean;
}) {
  const isResult = variant === "result";
  const symbolClass = cn(
    "justify-self-end text-right font-serif",
    CALC_NOTATION_CLASS,
    isResult && "text-[var(--color-primary)]"
  );
  const unitClass = cn(
    "text-sm",
    isResult ? "font-medium text-[var(--color-primary)]/80" : "text-[var(--color-muted-foreground)]"
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 py-2 sm:col-span-2 sm:grid-cols-subgrid sm:items-center",
        CALC_ROW_GRID,
        !borderless && !isResult && "border-b border-[var(--color-border)]/50 last:border-b-0",
        isResult && "rounded-lg bg-[var(--color-primary)]/6 py-4 ring-1 ring-[var(--color-primary)]/20"
      )}
    >
      <div className="min-w-0 text-base leading-snug text-[var(--color-foreground)]">
        {label ? <div className={cn(isResult && "font-medium text-[var(--color-heading)]")}>{label}</div> : null}
        {labelExtra}
      </div>
      <div className={CALC_VALUE_GRID}>
        {symbol ? <span className={symbolClass}>{symbol}</span> : <span />}
        <Input
          type="text"
          inputMode="decimal"
          className={cn(
            calcInputClass,
            isResult &&
              "border-[var(--color-primary)]/35 bg-[var(--color-primary)]/8 font-semibold text-[var(--color-primary)] shadow-none"
          )}
          value={value}
          onChange={(e) => onChange?.(e.target.value.replace(",", "."))}
          onFocus={onFocus}
        />
        {unit ? <span className={unitClass}>{unit}</span> : <span />}
      </div>
    </div>
  );
}

type ResultDrive = "ss" | "pp";

export function CylindricalShellExternalCalculator({
  handbook,
}: {
  handbook: SteelHandbook;
}) {
  const a = useAllowanceFields();
  const [D, setD] = useState("2000");
  const [p, setP] = useState("2");
  const [sigmaStr, setSigmaStr] = useState("120");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigma = num(sigmaStr, 120);
  const [EStr, setEStr] = useState("203");
  const E_MPa = num(EStr, 203) * 1000;
  const [l1, setL1] = useState("1000");
  const [ny, setNy] = useState("2.4");
  const [sp, setSp] = useState("");
  const [drive, setDrive] = useState<ExternalShellSolveTarget>("p");
  const [ss, setSs] = useState("");
  const [pp, setPp] = useState("");
  const [driveResult, setDriveResult] = useState<ResultDrive>("ss");

  const solveFor: ExternalShellSolveTarget = drive === "p" ? "sp" : "p";
  const ccNum = num(a.cc);
  const dNum = num(D);
  const l1Num = num(l1);
  const nyNum = num(ny, 2.4);

  const allowances = useMemo(
    () => ({
      c1: num(a.c1),
      c2: num(a.c2),
      c31: 0,
      c32: 0,
      c33: 0,
      c3: num(a.c3),
      cc: num(a.cc),
    }),
    [a.c1, a.c2, a.c3, a.cc]
  );

  const result = useMemo(
    () =>
      calculateCylindricalShellExternal({
        D: dNum,
        sigma,
        E: E_MPa,
        l1: l1Num,
        ny: nyNum,
        p: num(p),
        sp: num(sp),
        solveFor,
        allowances,
      }),
    [dNum, sigma, E_MPa, l1Num, nyNum, p, sp, solveFor, allowances]
  );

  const driveThicknessRaw = drive === "p" ? p : sp;
  const thicknessInputBlank = isBlank(driveThicknessRaw);

  const effectiveSp = useMemo(() => {
    if (driveResult === "ss") return isBlank(ss) ? 0 : num(ss) - ccNum;
    if (driveResult === "pp") {
      if (isBlank(pp)) return 0;
      return (
        calcSpFromAllowablePp(num(pp), dNum, sigma, E_MPa, l1Num, nyNum) ??
        result.sp
      );
    }
    if (drive === "sp") return isBlank(sp) ? 0 : num(sp);
    if (thicknessInputBlank) return 0;
    return result.sp;
  }, [driveResult, drive, ss, pp, result.sp, ccNum, dNum, sigma, E_MPa, l1Num, nyNum, sp, thicknessInputBlank]);

  const effectiveSs = effectiveSp + ccNum;

  const effectivePp = useMemo(() => {
    if (driveResult === "pp") return isBlank(pp) ? 0 : num(pp);
    if (thicknessInputBlank) return 0;
    return calcPpFromSp(effectiveSp, dNum, sigma, E_MPa, l1Num, nyNum) ?? result.pp;
  }, [driveResult, pp, effectiveSp, result.pp, dNum, sigma, E_MPa, l1Num, nyNum, thicknessInputBlank]);

  const displayP = drive === "p" ? p : fmtIfSource(result.p, sp, 2);
  const displaySp = drive === "sp" ? sp : thicknessInputBlank ? "" : fmt(effectiveSp);
  const displaySs = driveResult === "ss" ? ss : thicknessInputBlank ? "" : fmt(effectiveSs);
  const displayPp = driveResult === "pp" ? pp : thicknessInputBlank ? "" : fmt(effectivePp, 2);

  const activateP = () => {
    if (drive !== "p") {
      setDrive("p");
      if (result.error == null && !isBlank(sp)) setP(fmt(result.p, 2));
    }
  };

  const activateSp = () => {
    if (drive !== "sp") {
      setDrive("sp");
      if (result.error == null && !thicknessInputBlank) setSp(fmt(effectiveSp));
    }
  };

  const activateSs = () => {
    if (driveResult !== "ss") {
      setDriveResult("ss");
      if (!thicknessInputBlank) setSs(fmt(effectiveSs));
    }
  };

  const activatePp = () => {
    if (driveResult !== "pp") {
      setDriveResult("pp");
      if (!thicknessInputBlank) setPp(fmt(effectivePp, 2));
    }
  };

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader
        eyebrow="Калькулятор · ПНАЭ Г-7-002-86"
        title="Расчёт на прочность цилиндрической обечайки, нагруженной наружным избыточным давлением"
      />

      <section className="space-y-5">
        <AllowancesCalcSection
          c1={a.c1}
          c2={a.c2}
          c3={a.c3}
          cc={a.cc}
          onC1={a.setC1}
          onC2={a.setC2}
          onC3={a.setC3}
          onCc={a.setCc}
          ccSymbol={<Var letter="c" sub="c" />}
        />

          <CalcSection title="Исходные данные">
            <CalcRow label="Внутренний диаметр сосуда или аппарата" symbol="D" value={D} onChange={setD} unit="мм" />
            <CalcRow
              label="Расчётное наружное избыточное давление"
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
            <CalcRow label="Расчётная температура" symbol="T" value={sigmaTemp} onChange={setSigmaTemp} unit="°C" />
            <CalcRow
              label="Модуль продольной упругости при расчётной температуре"
              symbol="E"
              value={EStr}
              onChange={setEStr}
              unit="ГПа"
            />
            <CalcRow
              label="Расчётная длина гладкой обечайки"
              symbol={<Var letter="l" sub="1" />}
              value={l1}
              onChange={setL1}
              unit="мм"
            />
            <CalcRow
              label="Коэффициент запаса устойчивости (2,4 — эксплуатация; 1,8 — испытания и монтаж)"
              symbol={<Var letter="n" sub="y" />}
              value={ny}
              onChange={setNy}
              borderless
            />
          </CalcSection>

          <CalcSection title="Результаты расчёта">
            <CalcRow
              variant="result"
              label="Расчётная толщина стенки цилиндрической обечайки"
              symbol={CALC_RESULT_SP_SYMBOL}
              value={displaySp}
              onFocus={activateSp}
              onChange={(v) => {
                setDrive("sp");
                setSp(v);
              }}
              unit="мм"
            />
            <CalcRow
              variant="result"
              label="Исполнительная толщина стенки сосуда или аппарата"
              symbol="s"
              value={displaySs}
              onFocus={activateSs}
              onChange={(v) => {
                setDriveResult("ss");
                setSs(v);
              }}
              unit="мм"
            />
            <CalcRow
              variant="result"
              label="Допускаемое наружное избыточное давление"
              symbol="p"
              value={displayPp}
              onFocus={activatePp}
              onChange={(v) => {
                setDriveResult("pp");
                setPp(v);
              }}
              unit="МПа"
              borderless
            />
          </CalcSection>
      </section>

      {result.error ? (
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-4 py-2.5 text-sm text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : null}

      <CalculatorDiagramCard>
        <VesselDiagram diameter={dNum || 2000} thickness={effectiveSs || num(displaySp, 20)} />
      </CalculatorDiagramCard>
    </CalculatorPageShell>
  );
}
