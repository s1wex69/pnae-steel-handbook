import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculatePipeStrength } from "@/lib/pipeStrength";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { CalcRow, PipeAllowancesCalcSection } from "@/components/calculators/calculatorFields";
import {
  CalcSection,
  CalculatorDiagramCard,
  CalculatorPageHeader,
  CalculatorPageShell,
} from "@/components/calculators/calculatorUi";
import { VesselDiagram } from "@/components/calculators/VesselDiagram";
import { AllowSigma, Var } from "@/components/handbooks/MathNotation";
import { usePipeAllowanceFields } from "@/hooks/useStresscalcAllowanceFields";
import {
  stresscalcCorrosionAllowance,
} from "@/lib/stresscalcShell";
import { calcPipeSr } from "@/lib/pipeStrength";
import { fmtHundredths, isBlank, num } from "@/lib/calcInputUtils";

export function PipeInternalCalculator({ handbook }: { handbook: SteelHandbook }) {
  const allowances = usePipeAllowanceFields({ cMinus: "0.2", cCorrosion: "0" });
  const [Da, setDa] = useState("25");
  const [sigmaStr, setSigmaStr] = useState("140");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigma = num(sigmaStr, 140);
  const [phiP, setPhiP] = useState("0.8");
  const [p, setP] = useState("2");
  const [sNominal, setSNominal] = useState("2.5");

  const daNum = num(Da);
  const phiPNum = num(phiP, 1);
  const pNum = num(p);
  const sNominalNum = num(sNominal);
  const cMinusNum = num(allowances.cMinus);
  const cCorrosionNum = num(allowances.cCorrosion);

  const result = useMemo(
    () =>
      calculatePipeStrength({
        Da: daNum,
        sigma,
        phi: phiPNum,
        p: pNum,
        s: 0,
        cMinus: cMinusNum,
        cCorrosion: cCorrosionNum,
        cMinusManual: allowances.cMinusManual,
        nominalS: sNominalNum > 0 ? sNominalNum : undefined,
      }),
    [daNum, sigma, phiPNum, pNum, cMinusNum, cCorrosionNum, allowances.cMinusManual, sNominalNum]
  );

  useEffect(() => {
    if (!(daNum > 0) || !(pNum >= 0) || !(sigma > 0)) return;
    const c21 = stresscalcCorrosionAllowance(daNum, false);
    const sr = calcPipeSr(pNum, daNum, sigma);
    if (sr == null) return;
    allowances.syncAutoAllowances(
      daNum,
      sr,
      c21,
      sNominalNum > 0 ? sNominalNum : undefined
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- автоприбавки по Dₐ, p, [σ]
  }, [daNum, pNum, sigma, sNominalNum]);

  const inputsReady = !isBlank(p) && daNum > 0 && sigma > 0 && phiPNum > 0;
  const hasResult = inputsReady && result.error == null;

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title="Расчёт на прочность трубы, штуцера, коллектора" />

      <section className="space-y-8">
        <PipeAllowancesCalcSection
          collapsible
          cMinus={allowances.cMinus}
          cCorrosion={allowances.cCorrosion}
          cc={allowances.cc}
          onCMinus={allowances.setCMinus}
          onCCorrosion={allowances.setCCorrosion}
          onCc={allowances.setCc}
        />

        <CalcSection title="Исходные данные" titleAccent={false} twoColumns>
          <div className="min-w-0">
            <CalcRow
              inColumn
              label="Наружный диаметр трубы"
              symbol={<Var letter="D" sub="a" />}
              value={Da}
              onChange={setDa}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Расчётное внутреннее давление"
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
              label="Толщина трубы по сортаменту"
              symbol={<CalcSymbol>s</CalcSymbol>}
              value={sNominal}
              onChange={setSNominal}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Коэффициент снижения сварного шва"
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
              label="Допускаемое напряжение при расчётной температуре"
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

        <CalcSection title="Результаты расчёта" titleAccent={false} twoColumns>
          <CalcRow
            variant="result"
            disabled
            label="Расчётная толщина стенки трубы"
            symbol={<Var letter="s" sub="r" />}
            value={hasResult ? fmtHundredths(result.sr) : ""}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Расчётная толщина с учётом прибавок"
            symbol={<CalcSymbol>s</CalcSymbol>}
            value={hasResult ? fmtHundredths(result.sMin) : ""}
            unit="мм"
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
        <VesselDiagram
          diameter={daNum || 80}
          thickness={hasResult ? result.sMin : 2}
          outerDiameter
        />
      </CalculatorDiagramCard>
    </CalculatorPageShell>
  );
}

function CalcSymbol({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={className ?? "!text-2xl font-semibold"}>{children}</span>;
}
