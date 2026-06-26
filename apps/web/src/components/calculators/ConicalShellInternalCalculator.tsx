import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculateConicalShellInternal } from "@/lib/conicalShellInternal";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { AllowancesCalcSection, CalcRow } from "@/components/calculators/calculatorFields";
import {
  CalcCheckRow,
  CalcSection,
  CalculatorPageHeader,
  CalculatorPageShell,
  CALC_RESULT_SP_SYMBOL,
} from "@/components/calculators/calculatorUi";
import { AllowSigma, CalcSymbol, Frac, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { fmtHundredths, fmtHundredthsRu, isBlank, num } from "@/lib/calcInputUtils";

export function ConicalShellInternalCalculator({ handbook }: { handbook: SteelHandbook }) {
  const allowances = useAllowanceFields({ c1: "0.5", c2: "0.3", c3: "0" });
  const [D, setD] = useState("600");
  const [alpha, setAlpha] = useState("30");
  const [sigmaStr, setSigmaStr] = useState("140");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigma = num(sigmaStr, 140);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("1.6");

  const ccNum = num(allowances.cc);
  const dNum = num(D);
  const alphaNum = num(alpha);
  const phiPNum = num(phiP, 1);
  const pNum = num(p);

  const result = useMemo(
    () =>
      calculateConicalShellInternal({
        D: dNum,
        alphaDeg: alphaNum,
        sigma,
        phiP: phiPNum,
        p: pNum,
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
    [allowances, dNum, alphaNum, sigma, phiPNum, pNum, ccNum]
  );

  const inputsReady =
    !isBlank(p) && dNum > 0 && alphaNum > 0 && sigma > 0 && phiPNum > 0;
  const hasResult = inputsReady && result.error == null;
  const displaySp = hasResult ? fmtHundredths(result.sp) : "";
  const displaySs = hasResult ? fmtHundredths(result.ss) : "";

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title="Расчёт на прочность конической обечайки, нагруженной внутренним избыточным давлением" />

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
              label="Внутренний диаметр большего основания конуса"
              symbol="D"
              value={D}
              onChange={setD}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Полуугол при вершине конуса"
              symbol="α"
              value={alpha}
              onChange={setAlpha}
              unit="°"
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
              label="Расчётная температура"
              symbol="T"
              value={sigmaTemp}
              onChange={setSigmaTemp}
              unit="°C"
            />
            <CalcRow
              inColumn
              label="Коэффициент прочности сварного шва"
              symbol={<Var letter="φ" />}
              value={phiP}
              onChange={setPhiP}
              borderless
            />
          </div>
          <div className="min-w-0">
            <CalcRow
              inColumn
              inlineLabelExtra
              label="Допускаемое напряжение"
              labelExtra={
                <div className="mt-1.5">
                  <AllowableStressFromHandbook
                    handbook={handbook}
                    value={sigmaStr}
                    onChange={(n) => setSigmaStr(fmtHundredths(n))}
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
        </CalcSection>

        <CalcSection title="Результаты расчёта" titleAccent={false}>
          <CalcRow
            variant="result"
            disabled
            label="Расчётная толщина стенки конической обечайки"
            symbol={CALC_RESULT_SP_SYMBOL}
            value={displaySp}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Исполнительная толщина стенки конической обечайки"
            symbol={<CalcSymbol className="!text-2xl">s</CalcSymbol>}
            value={displaySs}
            unit="мм"
            borderless
          />
        </CalcSection>

        <CalcSection title="Условия применимости расчетных формул" titleAccent={false}>
          {hasResult ? (
            <CalcCheckRow ok={result.thinnessOk}>
              <Frac num={<>s − c</>} den="D" />
              <span>= {fmtHundredthsRu(result.thinnessRatio)}</span>
              <span>{result.thinnessOk ? "≤" : ">"} 0,1</span>
            </CalcCheckRow>
          ) : null}
          <CalcCheckRow ok={result.alphaOk}>
            <span>α ≤ 70° → α = {fmtHundredthsRu(alphaNum)}°</span>
          </CalcCheckRow>
          {hasResult ? (
            <CalcCheckRow ok={result.pressureOk}>
              <span>
                p ≤ [p] → {fmtHundredthsRu(pNum)} МПа ≤ {fmtHundredthsRu(result.pp)} МПа
              </span>
            </CalcCheckRow>
          ) : null}
        </CalcSection>
      </section>

      {result.error ? (
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-6 py-4 text-lg text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : null}
    </CalculatorPageShell>
  );
}
