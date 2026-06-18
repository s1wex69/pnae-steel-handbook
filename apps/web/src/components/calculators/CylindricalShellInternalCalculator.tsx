import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  calculateCylindricalShellInternal,
  calcAllowablePressure,
  calcSsFromAllowablePressure,
  checkApplicability,
  type ShellSolveTarget,
} from "@/lib/cylindricalShellInternal";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { AllowancesCalcSection, CalcRow } from "@/components/calculators/calculatorFields";
import {
  CalcSection,
  CalculatorDiagramCard,
  CalculatorPageHeader,
  CalculatorPageShell,
} from "@/components/calculators/calculatorUi";
import { VesselDiagram } from "@/components/calculators/VesselDiagram";
import { AllowSigma, Frac, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { cn } from "@/lib/utils";
import { fmt, fmtIfSource, isBlank, num } from "@/lib/calcInputUtils";

type ResultDrive = "ss" | "pp";

export function CylindricalShellInternalCalculator({
  handbook,
}: {
  handbook: SteelHandbook;
}) {
  const allowances = useAllowanceFields();
  const [D, setD] = useState("2000");
  const [sigmaStr, setSigmaStr] = useState("130");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigma = num(sigmaStr, 130);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("10");
  const [sp, setSp] = useState("80");
  const [drive, setDrive] = useState<ShellSolveTarget>("p");
  const [ss, setSs] = useState("");
  const [pp, setPp] = useState("");
  const [driveResult, setDriveResult] = useState<ResultDrive>("ss");

  const solveFor: ShellSolveTarget = drive === "p" ? "sp" : "p";
  const ccNum = num(allowances.cc);
  const dNum = num(D);
  const phiPNum = num(phiP, 1);

  const result = useMemo(
    () =>
      calculateCylindricalShellInternal({
        D: dNum,
        sigma,
        phiP: phiPNum,
        p: num(p),
        sp: num(sp),
        solveFor,
        allowances: {
          c1: num(allowances.c1),
          c2: num(allowances.c2),
          c31: 0,
          c32: 0,
          c33: 0,
          c3: num(allowances.c3),
          cc: ccNum,
        },
      }),
    [allowances, dNum, sigma, phiPNum, p, sp, solveFor, ccNum]
  );

  const thicknessInputBlank = isBlank(drive === "p" ? p : sp);
  const displayP = drive === "p" ? p : fmtIfSource(result.p, sp, 2);
  const displaySp = drive === "sp" ? sp : fmtIfSource(result.sp, p);

  const effectiveSs = useMemo(() => {
    if (driveResult === "ss") {
      if (!isBlank(ss)) return num(ss);
      if (thicknessInputBlank) return 0;
      return result.ss;
    }
    if (thicknessInputBlank) return 0;
    return (
      calcSsFromAllowablePressure(
        num(pp || fmt(result.pp, 2)),
        ccNum,
        dNum,
        sigma,
        phiPNum
      ) ?? result.ss
    );
  }, [driveResult, ss, pp, result.ss, result.pp, ccNum, dNum, sigma, phiPNum, thicknessInputBlank]);

  const displaySs =
    driveResult === "ss" && !isBlank(ss)
      ? ss
      : thicknessInputBlank
        ? ""
        : fmt(result.ss);

  const effectivePp = useMemo(() => {
    if (driveResult === "pp") return isBlank(pp) ? 0 : num(pp);
    if (thicknessInputBlank) return 0;
    return calcAllowablePressure(effectiveSs, ccNum, dNum, sigma, phiPNum) ?? result.pp;
  }, [driveResult, pp, effectiveSs, result.pp, ccNum, dNum, sigma, phiPNum, thicknessInputBlank]);

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

  const activateSp = () => setDrive("sp");

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader
        eyebrow="Калькулятор"
        title="Расчёт на прочность цилиндрической обечайки при внутреннем избыточном давлении"
        standard="по ГОСТ 34233.1-2017, приложение Д"
      />

      <section className="space-y-8">
        <AllowancesCalcSection
          c1={allowances.c1}
          c2={allowances.c2}
          c3={allowances.c3}
          cc={allowances.cc}
          onC1={allowances.setC1}
          onC2={allowances.setC2}
          onC3={allowances.setC3}
          onCc={allowances.setCc}
          ccSymbol={<Var letter="c" sub="c" />}
        />

        <CalcSection title="Исходные данные" titleAccent={false}>
          <CalcRow
            label="Внутренний диаметр сосуда или аппарата"
            symbol="D"
            value={D}
            onChange={setD}
            unit="мм"
          />
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
            symbol={<Var letter="s" sub="s" />}
            value={displaySs}
            onFocus={() => setDriveResult("ss")}
            onChange={(v) => {
              setDriveResult("ss");
              setSs(v);
            }}
            unit="мм"
          />
          <CalcRow
            label="Допускаемое внутреннее избыточное давление"
            symbol={<Var letter="p" sub="p" />}
            value={driveResult === "pp" ? pp : thicknessInputBlank ? "" : fmt(effectivePp, 2)}
            onFocus={() => setDriveResult("pp")}
            onChange={(v) => {
              setDriveResult("pp");
              setPp(v);
            }}
            unit="МПа"
            borderless
          />
        </CalcSection>

        <CalcSection title="Проверка применимости" titleAccent={false}>
          <CalcRow label="Проверка применимости расчётной методики" variant="check" borderless>
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
        <VesselDiagram
          diameter={dNum || 2000}
          thickness={effectiveSs || num(displaySp, 80)}
        />
      </CalculatorDiagramCard>
    </CalculatorPageShell>
  );
}
