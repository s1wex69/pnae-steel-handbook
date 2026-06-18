import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  calculatePipeCollector,
  calcAllowablePressure,
  calcSsFromAllowablePressure,
  checkPipeApplicability,
} from "@/lib/pipeCollector";
import type { ShellSolveTarget } from "@/lib/shellCalcShared";
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

export function PipeCollectorCalculator({ handbook }: { handbook: SteelHandbook }) {
  const a = useAllowanceFields();
  const [Da, setDa] = useState("219");
  const [sigmaStr, setSigmaStr] = useState("130");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigma = num(sigmaStr, 130);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("10");
  const [sp, setSp] = useState("8");
  const [drive, setDrive] = useState<ShellSolveTarget>("p");
  const [ss, setSs] = useState("");
  const [pp, setPp] = useState("");
  const [driveResult, setDriveResult] = useState<ResultDrive>("ss");

  const solveFor: ShellSolveTarget = drive === "p" ? "sp" : "p";
  const ccNum = num(a.cc);
  const daNum = num(Da);
  const phiPNum = num(phiP, 1);

  const result = useMemo(
    () =>
      calculatePipeCollector({
        Da: daNum,
        sigma,
        phiP: phiPNum,
        p: num(p),
        sp: num(sp),
        solveFor,
        allowances: {
          c1: num(a.c1),
          c2: num(a.c2),
          c31: num(a.c31),
          c32: num(a.c32),
          c33: num(a.c33),
          c3: num(a.c3),
          cc: ccNum,
        },
      }),
    [a, daNum, sigma, phiPNum, p, sp, solveFor, ccNum]
  );

  const thicknessInputBlank = isBlank(drive === "p" ? p : sp);
  const displayP = drive === "p" ? p : fmtIfSource(result.p, sp, 2);
  const displaySp = drive === "sp" ? sp : fmtIfSource(result.sp, p);

  const effectiveSs = useMemo(() => {
    if (driveResult === "ss") return isBlank(ss) ? 0 : num(ss);
    if (thicknessInputBlank) return 0;
    return calcSsFromAllowablePressure(num(pp || fmt(result.pp, 2)), ccNum, daNum, sigma, phiPNum) ?? result.ss;
  }, [driveResult, ss, pp, result.ss, result.pp, ccNum, daNum, sigma, phiPNum, thicknessInputBlank]);

  const effectivePp = useMemo(() => {
    if (driveResult === "pp") return isBlank(pp) ? 0 : num(pp);
    if (thicknessInputBlank) return 0;
    return calcAllowablePressure(effectiveSs, ccNum, daNum, sigma, phiPNum) ?? result.pp;
  }, [driveResult, pp, effectiveSs, result.pp, ccNum, daNum, sigma, phiPNum, thicknessInputBlank]);

  const applicability = useMemo(
    () => checkPipeApplicability(effectiveSs - ccNum, daNum),
    [effectiveSs, ccNum, daNum]
  );

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader
        eyebrow="Калькулятор · ИН № 7"
        title="Цилиндрический коллектор, штуцер, труба — толщина стенки и допускаемое давление"
      />

      <section className="space-y-8">
        <AllowancesCalcSection
          expanded={a.expanded}
          onToggle={a.toggleExpanded}
          c1={a.c1} c2={a.c2} c31={a.c31} c32={a.c32} c33={a.c33} c3={a.c3} cc={a.cc}
          onC1={a.setC1} onC2={a.setC2} onC31={a.setC31} onC32={a.setC32} onC33={a.setC33}
          onC3={a.setC3} onCc={a.setCc}
        />

        <CalcSection title="Исходные данные">
          <CalcRow label="Номинальный наружный диаметр D_a" symbol={<Var letter="D" sub="a" />} value={Da} onChange={setDa} unit="мм" />
          <CalcRow label="Расчётное давление" symbol="p" value={displayP} onFocus={() => setDrive("p")} onChange={(v) => { setDrive("p"); setP(v); }} unit="МПа" />
          <CalcRow
            label="Допускаемое напряжение"
            labelExtra={
              <div className="mt-1.5">
                <AllowableStressFromHandbook handbook={handbook} value={sigmaStr} onChange={(n) => setSigmaStr(String(n))} embedded pickersOnly stacked collapsibleSteelPickers externalTemperature temperature={sigmaTemp} onTemperatureChange={setSigmaTemp} />
              </div>
            }
            symbol={<AllowSigma />}
            value={sigmaStr}
            onChange={setSigmaStr}
            unit="МПа"
          />
          <CalcRow label="Температура" symbol="T" value={sigmaTemp} onChange={setSigmaTemp} unit="°C" />
          <CalcRow label="Коэффициент снижения прочности" symbol={<Var letter="φ" />} value={phiP} onChange={setPhiP} />
          <CalcRow label="Расчётная толщина стенки" symbol={<Var letter="s" sub="R" />} value={displaySp} onFocus={() => setDrive("sp")} onChange={(v) => { setDrive("sp"); setSp(v); }} unit="мм" borderless />
        </CalcSection>

        <CalcSection title="Результаты расчёта">
          <CalcRow label="Номинальная толщина стенки" symbol="s" value={driveResult === "ss" ? ss : thicknessInputBlank ? "" : fmt(effectiveSs)} onFocus={() => setDriveResult("ss")} onChange={(v) => { setDriveResult("ss"); setSs(v); }} unit="мм" />
          <CalcRow label="Допускаемое давление" symbol="p" value={driveResult === "pp" ? pp : thicknessInputBlank ? "" : fmt(effectivePp, 2)} onFocus={() => setDriveResult("pp")} onChange={(v) => { setDriveResult("pp"); setPp(v); }} unit="МПа" borderless />
        </CalcSection>

        <CalcSection title="Проверка применимости">
          <CalcRow label="Предел применимости формулы" variant="check" borderless>
            <span className={cn("inline-flex flex-wrap items-center gap-x-2 text-xl font-semibold tabular-nums", applicability.ok ? "text-[var(--color-emphasis)]" : "text-[var(--color-destructive)]")}>
              <Frac num={<>s − c</>} den={<Var letter="D" sub="a" />} />
              <span>= {fmt(applicability.ratio, 3)} {applicability.ok ? "≤" : ">"} {applicability.limit}</span>
            </span>
          </CalcRow>
        </CalcSection>
      </section>

      {result.error ? <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-6 py-4 text-lg text-[var(--color-destructive)]">{result.error}</p> : null}

      <CalculatorDiagramCard>
        <VesselDiagram diameter={daNum || 219} thickness={effectiveSs || num(sp, 8)} />
      </CalculatorDiagramCard>
    </CalculatorPageShell>
  );
}
