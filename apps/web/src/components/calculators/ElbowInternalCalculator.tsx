import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculateElbow } from "@/lib/elbow";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import {
  CALC_SECTION_CARD,
  CalculatorPageHeader,
  CalculatorPageShell,
  CalcSectionHeading,
} from "@/components/calculators/calculatorUi";
import { CalcRow, ElbowAllowancesCalcSection } from "@/components/calculators/calculatorFields";
import { AllowSigma, Var } from "@/components/handbooks/MathNotation";
import { useElbowAllowanceFields } from "@/hooks/useStresscalcAllowanceFields";
import { fmtHundredths, isBlank, num } from "@/lib/calcInputUtils";
import { inferElbowSteelClassFromMark } from "@/lib/stresscalcShell";

export function ElbowInternalCalculator({ handbook }: { handbook: SteelHandbook }) {
  const allowances = useElbowAllowanceFields();
  const [p, setP] = useState("1");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const [sigmaStr, setSigmaStr] = useState("147");
  const [steelMark, setSteelMark] = useState("20");
  const [Da, setDa] = useState("273");
  const [s, setS] = useState("8");
  const [Rs, setRs] = useState("450");
  const [ovalityA, setOvalityA] = useState("8");
  const [phiP, setPhiP] = useState("1");

  const sigma = num(sigmaStr);
  const steelClass = inferElbowSteelClassFromMark(steelMark);
  const daNum = num(Da);
  const rsNum = num(Rs);
  const pNum = num(p);
  const sNum = num(s);
  const phiPNum = num(phiP, 1);
  const temperatureNum = num(sigmaTemp);

  const result = useMemo(
    () =>
      calculateElbow({
        Da: daNum,
        Rs: rsNum,
        sigma,
        phi: phiPNum,
        p: pNum,
        s: sNum,
        temperatureC: temperatureNum,
        steelClass,
        ovalityA: num(ovalityA),
        allowances: {
          c11: num(allowances.c11),
          c12: num(allowances.c12),
          c21: num(allowances.c21),
        },
      }),
    [allowances.c11, allowances.c12, allowances.c21, daNum, rsNum, sigma, phiPNum, pNum, sNum, temperatureNum, steelClass, ovalityA]
  );

  const inputsReady = !isBlank(p) && daNum > 0 && rsNum > 0 && sigma > 0 && sNum > 0 && phiPNum > 0;
  const hasResult = inputsReady && result.error == null;

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title="Расчёт колен, отводов, коллекторов на внутреннее давление" />

      <section className="space-y-5">
        <ElbowAllowancesCalcSection
          collapsible
          c11={allowances.c11}
          c12={allowances.c12}
          c21={allowances.c21}
          cc={allowances.cc}
          onC11={allowances.setC11}
          onC12={allowances.setC12}
          onC21={allowances.setC21}
          onCc={allowances.setCc}
        />

      <section className={CALC_SECTION_CARD}>
        <CalcSectionHeading title="Исходные данные для расчёта" />
        <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-0 xl:grid-cols-2 xl:items-start">
          <div className="min-w-0">
            <CalcRow
              inColumn
              label="Расчётное давление"
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
              label="Наружный диаметр трубы"
              symbol={<Var letter="D" sub="a" />}
              value={Da}
              onChange={setDa}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Толщина стенки трубы"
              symbol={<Var letter="s" />}
              value={s}
              onChange={setS}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Радиус кривизны оси гиба"
              symbol={<Var letter="R" />}
              value={Rs}
              onChange={setRs}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Овальность поперечного сечения"
              symbol="a"
              value={ovalityA}
              onChange={setOvalityA}
              unit="%"
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
                    onMarkChange={setSteelMark}
                    embedded
                    pickersOnly
                    stacked
                    collapsibleSteelPickers
                    externalTemperature
                    temperature={sigmaTemp}
                    onTemperatureChange={setSigmaTemp}
                    defaultMark="20"
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
        </div>
      </section>

      <section className={CALC_SECTION_CARD}>
        <CalcSectionHeading title="Результаты расчёта" />
        <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-0 xl:grid-cols-2 xl:items-start">
          <div className="min-w-0">
            <CalcRow
              variant="result"
              disabled
              inColumn
              label="Номинальная толщина стенки трубы"
              symbol={<Var letter="s" sub="R" />}
              value={hasResult ? fmtHundredths(result.sr) : ""}
              unit="мм"
            />
            <CalcRow
              variant="result"
              disabled
              inColumn
              label="Номинальная толщина стенки внешней стороны"
              symbol={<Var letter="s" sub="R1" />}
              value={hasResult ? fmtHundredths(result.sr1) : ""}
              unit="мм"
            />
            <CalcRow
              variant="result"
              disabled
              inColumn
              label="Номинальная толщина стенки внутренней стороны"
              symbol={<Var letter="s" sub="R2" />}
              value={hasResult ? fmtHundredths(result.sr2) : ""}
              unit="мм"
              borderless
            />
          </div>
          <div className="min-w-0">
            <CalcRow
              variant="result"
              disabled
              inColumn
              label="Расчётная толщина без учёта прибавок"
              symbol={<Var letter="s" sub="R" />}
              value={hasResult ? fmtHundredths(result.srMax) : ""}
              unit="мм"
            />
            <CalcRow
              variant="result"
              disabled
              inColumn
              label="Расчётная толщина с учётом прибавок"
              symbol={<Var letter="s" sub="n" />}
              value={hasResult ? fmtHundredths(result.snMax) : ""}
              unit="мм"
              borderless
            />
          </div>
        </div>
      </section>
      </section>

      {result.error ? (
        <p className="mt-5 rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-4 py-2.5 text-sm text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : null}
    </CalculatorPageShell>
  );
}
