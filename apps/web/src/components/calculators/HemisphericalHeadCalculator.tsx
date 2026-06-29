import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  calculateHemisphericalHead,
  calcAllowablePressure,
  calcSsFromAllowablePressure,
  checkHemisphericalApplicability,
} from "@/lib/hemisphericalHead";
import type { ShellSolveTarget } from "@/lib/shellCalcShared";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { AllowancesCalcSection, CalcRow } from "@/components/calculators/calculatorFields";
import {
  CalcSection,
  CalculatorPageHeader,
  CalculatorPageShell,
  CALC_APPLICABILITY_TITLE,
  CalcApplicabilityRangeRow,
} from "@/components/calculators/calculatorUi";
import { AllowSigma, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { fmt, fmtIfSource, fmtRu, isBlank, num } from "@/lib/calcInputUtils";

type ResultDrive = "ss" | "pp";

export function HemisphericalHeadCalculator({ handbook }: { handbook: SteelHandbook }) {
  const allowances = useAllowanceFields();
  const [D, setD] = useState("2000");
  const [sigmaStr, setSigmaStr] = useState("130");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigma = num(sigmaStr, 130);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("1.6");
  const [sp, setSp] = useState("12");
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
      calculateHemisphericalHead({
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
    if (driveResult === "ss") return isBlank(ss) ? 0 : num(ss);
    if (thicknessInputBlank) return 0;
    return calcSsFromAllowablePressure(num(pp || fmt(result.pp, 2)), ccNum, dNum, sigma, phiPNum) ?? result.ss;
  }, [driveResult, ss, pp, result.ss, result.pp, ccNum, dNum, sigma, phiPNum, thicknessInputBlank]);

  const effectivePp = useMemo(() => {
    if (driveResult === "pp") return isBlank(pp) ? 0 : num(pp);
    if (thicknessInputBlank) return 0;
    return calcAllowablePressure(effectiveSs, ccNum, dNum, sigma, phiPNum) ?? result.pp;
  }, [driveResult, pp, effectiveSs, result.pp, ccNum, dNum, sigma, phiPNum, thicknessInputBlank]);

  const activateP = () => {
    if (drive !== "p") {
      setDrive("p");
      if (result.error == null && !isBlank(sp)) setP(fmt(result.p, 2));
    }
  };

  const activateSp = () => setDrive("sp");

  const applicability = useMemo(
    () => checkHemisphericalApplicability(effectiveSs - ccNum, dNum),
    [effectiveSs, ccNum, dNum]
  );

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader
        eyebrow="Калькулятор · ИН № 6"
        title="Полусферическое днище — толщина стенки и допускаемое давление"
      />

      <section className="space-y-5">
        <AllowancesCalcSection
          c1={allowances.c1}
          c2={allowances.c2}
          c3={allowances.c3}
          cc={allowances.cc}
          onC1={allowances.setC1}
          onC2={allowances.setC2}
          onC3={allowances.setC3}
          onCc={allowances.setCc}
        />

        <CalcSection title="Исходные данные">
          <CalcRow label="Номинальный внутренний диаметр днища в месте стыка с обечайкой" symbol="D" value={D} onChange={setD} unit="мм" />
          <CalcRow
            label="Расчётное внутреннее избыточное давление"
            symbol="p"
            value={displayP}
            onFocus={activateP}
            onChange={(v) => { setDrive("p"); setP(v); }}
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
          <CalcRow label="Коэффициент снижения прочности" symbol={<Var letter="φ" />} value={phiP} onChange={setPhiP} />
          <CalcRow
            label="Расчётная толщина стенки днища"
            symbol={<Var letter="s" sub="R" />}
            value={displaySp}
            onFocus={activateSp}
            onChange={(v) => { setDrive("sp"); setSp(v); }}
            unit="мм"
            borderless
          />
        </CalcSection>

        <CalcSection title="Результаты расчёта">
          <CalcRow
            label="Номинальная толщина стенки"
            symbol="s"
            value={driveResult === "ss" ? ss : thicknessInputBlank ? "" : fmt(effectiveSs)}
            onFocus={() => setDriveResult("ss")}
            onChange={(v) => { setDriveResult("ss"); setSs(v); }}
            unit="мм"
          />
          <CalcRow
            label="Допускаемое давление"
            symbol="p"
            value={driveResult === "pp" ? pp : thicknessInputBlank ? "" : fmt(effectivePp, 2)}
            onFocus={() => setDriveResult("pp")}
            onChange={(v) => { setDriveResult("pp"); setPp(v); }}
            unit="МПа"
            borderless
          />
        </CalcSection>

        <CalcSection title={CALC_APPLICABILITY_TITLE}>
          <CalcApplicabilityRangeRow
            ratio={applicability.ratio}
            min={applicability.min}
            max={applicability.max}
            minLabel={fmtRu(applicability.min, 4)}
            maxLabel={fmtRu(applicability.max, 2)}
            num={<>s − c</>}
            den="D"
          />
        </CalcSection>
      </section>

      {result.error ? (
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-4 py-2.5 text-sm text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : null}
    </CalculatorPageShell>
  );
}
