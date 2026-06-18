import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  calculateCylindricalShellInternal,
  checkApplicability,
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
import { AllowSigma, CalcSymbol, Frac, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { cn } from "@/lib/utils";
import { fmt, isBlank, num } from "@/lib/calcInputUtils";

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
        sp: 0,
        solveFor: "sp",
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
    [allowances, dNum, sigma, phiPNum, p, ccNum]
  );

  const inputsReady = !isBlank(p) && dNum > 0 && sigma > 0 && phiPNum > 0;
  const displaySp = inputsReady && result.error == null ? fmt(result.sp) : "";
  const displaySs = inputsReady && result.error == null ? fmt(result.ss) : "";

  const applicability = useMemo(
    () => checkApplicability(result.ss - ccNum, dNum),
    [result.ss, ccNum, dNum]
  );

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader
        title="Расчёт на прочность цилиндрической обечайки при внутреннем избыточном давлении"
        standard="по ГОСТ 34233.2-2017"
      />

      <section className="space-y-8">
        <AllowancesCalcSection
          collapsible
          c1={allowances.c1}
          c2={allowances.c2}
          c3={allowances.c3}
          cc={allowances.cc}
          onC1={allowances.setC1}
          onC2={allowances.setC2}
          onC3={allowances.setC3}
          onCc={allowances.setCc}
        />

        <CalcSection title="Исходные данные" titleAccent={false} twoColumns>
          <div className="min-w-0">
            <CalcRow
              inColumn
              label="Внутренний диаметр обечайки"
              symbol="D"
              value={D}
              onChange={setD}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Расчётное внутреннее избыточное давление"
              symbol="p"
              value={p}
              onChange={setP}
              unit="МПа"
            />
            <CalcRow
              inColumn
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
              borderless
            />
          </div>
          <div className="min-w-0">
            <CalcRow
              inColumn
              label="Температура"
              symbol="T"
              value={sigmaTemp}
              onChange={setSigmaTemp}
              unit="°C"
            />
            <CalcRow
              inColumn
              label="Коэффициент прочности продольного сварного шва"
              symbol={<Var letter="φ" sub="p" />}
              value={phiP}
              onChange={setPhiP}
              borderless
            />
          </div>
        </CalcSection>

        <CalcSection title="Результаты расчёта" titleAccent={false}>
          <CalcRow
            variant="result"
            disabled
            label="Расчётная толщина стенки цилиндрической обечайки"
            symbol={<CalcSymbol>s</CalcSymbol>}
            value={displaySp}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Исполнительная толщина стенки цилиндрической обечайки"
            symbol={<CalcSymbol>s</CalcSymbol>}
            value={displaySs}
            unit="мм"
            borderless
          />
        </CalcSection>

        <CalcSection title="Условие применения расчётных формул" titleAccent={false}>
          <div className="sm:col-span-2">
            <span
              className={cn(
                "inline-flex flex-wrap items-center gap-x-2 text-xl font-semibold tabular-nums",
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
          </div>
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
          thickness={result.ss > 0 ? result.ss : num(displaySp, 80) + ccNum}
        />
      </CalculatorDiagramCard>
    </CalculatorPageShell>
  );
}
