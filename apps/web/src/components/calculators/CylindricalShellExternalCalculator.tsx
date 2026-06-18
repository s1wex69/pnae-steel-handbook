import { useEffect, useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  calculateCylindricalShellExternal,
  calcPpFromSp,
  calcSpFromAllowablePp,
  type ExternalShellSolveTarget,
} from "@/lib/cylindricalShellExternal";
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
import { VesselDiagram } from "@/components/calculators/VesselDiagram";
import { AllowSigma, Var } from "@/components/handbooks/MathNotation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmt, fmtIfSource, isBlank, num, sumFmt } from "@/lib/calcInputUtils";

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
    "justify-self-end text-right text-lg font-medium",
    isResult ? "text-[var(--color-primary)]" : "text-[var(--color-heading)]"
  );
  const unitClass = cn(
    "text-lg",
    isResult ? "font-medium text-[var(--color-primary)]/80" : "text-[var(--color-muted-foreground)]"
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 py-3 sm:col-span-2 sm:grid-cols-subgrid sm:items-center",
        CALC_ROW_GRID,
        !borderless && !isResult && "border-b border-[var(--color-border)]/50 last:border-b-0",
        isResult && "rounded-lg bg-[var(--color-primary)]/6 py-4 ring-1 ring-[var(--color-primary)]/20"
      )}
    >
      <div className="min-w-0 text-lg leading-snug text-[var(--color-foreground)]">
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
  const [c1, setC1] = useState("0.2");
  const [c2, setC2] = useState("0.2");
  const [c31, setC31] = useState("0.1");
  const [c32, setC32] = useState("0.1");
  const [c33, setC33] = useState("0.1");
  const [c3, setC3] = useState("0.3");
  const [cc, setCc] = useState("0.7");
  const [c3Manual, setC3Manual] = useState(false);
  const [ccManual, setCcManual] = useState(false);
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
  const [allowancesExpanded, setAllowancesExpanded] = useState(false);

  const solveFor: ExternalShellSolveTarget = drive === "p" ? "sp" : "p";
  const ccNum = num(cc);
  const dNum = num(D);
  const l1Num = num(l1);
  const nyNum = num(ny, 2.4);

  useEffect(() => {
    if (c3Manual) return;
    setC3(sumFmt([c31, c32, c33]));
  }, [c31, c32, c33, c3Manual]);

  useEffect(() => {
    if (ccManual) return;
    setCc(sumFmt([c1, c2, c3]));
  }, [c1, c2, c3, ccManual]);

  const allowances = useMemo(
    () => ({
      c1: num(c1),
      c2: num(c2),
      c31: num(c31),
      c32: num(c32),
      c33: num(c33),
      c3: num(c3),
      cc: num(cc),
    }),
    [c1, c2, c31, c32, c33, c3, cc]
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
        title="Расчёт на прочность цилиндрической обечайки при действии наружного избыточного давления"
      />

      <section className="space-y-8">
        <CalcSection
            title="Прибавки к расчётной толщине"
            collapsible
            expanded={allowancesExpanded}
            onToggle={() => setAllowancesExpanded((v) => !v)}
            details={
              <>
                <CalcRow
                  label="Прибавка для компенсации коррозии и эрозии"
                  symbol={<Var letter="c" sub="1" />}
                  value={c1}
                  onChange={(v) => {
                    setCcManual(false);
                    setC1(v);
                  }}
                  unit="мм"
                />
                <CalcRow
                  label="Прибавка для компенсации минусового допуска"
                  symbol={<Var letter="c" sub="2" />}
                  value={c2}
                  onChange={(v) => {
                    setCcManual(false);
                    setC2(v);
                  }}
                  unit="мм"
                />
                <CalcRow
                  label="Технологическая прибавка (утонение с внешней стороны отвода)"
                  symbol={<Var letter="c" sub="31" />}
                  value={c31}
                  onChange={(v) => {
                    setC3Manual(false);
                    setC31(v);
                  }}
                  unit="мм"
                />
                <CalcRow
                  label="Технологическая прибавка (утонение с внутренней стороны отвода)"
                  symbol={<Var letter="c" sub="32" />}
                  value={c32}
                  onChange={(v) => {
                    setC3Manual(false);
                    setC32(v);
                  }}
                  unit="мм"
                />
                <CalcRow
                  label="Технологическая прибавка (средняя часть отвода, ±15 % нейтральной линии)"
                  symbol={<Var letter="c" sub="33" />}
                  value={c33}
                  onChange={(v) => {
                    setC3Manual(false);
                    setC33(v);
                  }}
                  unit="мм"
                />
                <CalcRow
                  label="Технологическая прибавка"
                  symbol={<Var letter="c" sub="3" />}
                  value={c3}
                  onChange={(v) => {
                    setC3Manual(true);
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
              symbol={<Var letter="c" sub="c" />}
              value={cc}
              onChange={(v) => {
                setCcManual(true);
                setCc(v);
              }}
              unit="мм"
              borderless
            />
          </CalcSection>

          <CalcSection title="Исходные данные">
            <CalcRow label="Внутренний диаметр сосуда или аппарата" symbol="D" value={D} onChange={setD} unit="мм" />
            <CalcRow
              label="Расчётное избыточное наружное давление"
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
            <CalcRow label="Температура" symbol="T" value={sigmaTemp} onChange={setSigmaTemp} unit="°C" />
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
              symbol="s"
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
              label="Допускаемое избыточное наружное давление"
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
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-6 py-4 text-lg text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : null}

      <CalculatorDiagramCard>
        <VesselDiagram diameter={dNum || 2000} thickness={effectiveSs || num(displaySp, 20)} />
      </CalculatorDiagramCard>
    </CalculatorPageShell>
  );
}
