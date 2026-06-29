import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculateConvexHeadInternal, type ConvexHeadKind } from "@/lib/convexHeadGost34233";
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

function methodologyTitle(kind: ConvexHeadKind): string {
  return kind === "hemispherical"
    ? "Расчёт на прочность полусферического днища, нагруженного внутренним избыточным давлением"
    : "Расчёт на прочность эллиптического днища, нагруженного внутренним избыточным давлением";
}

const INITIAL_D = "500";

function defaultHeadHeight(kind: ConvexHeadKind, d: number): string {
  if (!(d > 0)) return "";
  const h = kind === "hemispherical" ? d / 2 : d * 0.25;
  return fmtHundredths(h);
}

export function ConvexHeadInternalCalculator({
  handbook,
  kind,
}: {
  handbook: SteelHandbook;
  kind: ConvexHeadKind;
}) {
  const allowances = useAllowanceFields();
  const [D, setD] = useState(INITIAL_D);
  const [H, setH] = useState(() => defaultHeadHeight(kind, num(INITIAL_D)));
  const [hManual, setHManual] = useState(false);
  const [sigmaStr, setSigmaStr] = useState("120");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigma = num(sigmaStr, 120);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("0.2");

  const dNum = num(D);
  const hNum = num(H);
  const ccNum = num(allowances.cc);
  const phiPNum = num(phiP, 1);

  const result = useMemo(
    () =>
      calculateConvexHeadInternal({
        kind,
        D: dNum,
        H: hNum,
        sigma,
        phiP: phiPNum,
        p: num(p),
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
    [kind, allowances, dNum, hNum, sigma, phiPNum, p, ccNum]
  );

  const inputsReady = !isBlank(p) && dNum > 0 && hNum > 0 && sigma > 0 && phiPNum > 0;
  const geometryReady = dNum > 0 && hNum > 0;
  const hasResult = inputsReady && result.error == null;
  const displayR = geometryReady && result.R > 0 ? fmtHundredths(result.R) : "";
  const displaySp = hasResult ? fmtHundredths(result.sp) : "";
  const displaySs = hasResult ? fmtHundredths(result.ss) : "";

  const heightRatio = geometryReady ? hNum / dNum : 0;
  const ellipticalThinOk =
    hasResult && result.thinnessRatio >= 0.002 && result.thinnessRatio <= 0.1;
  const ellipticalHeightOk = geometryReady && heightRatio >= 0.2 && heightRatio <= 0.5;
  const hemisphericalThinOk =
    hasResult && result.thinnessRatio >= 0.0025 && result.thinnessRatio <= 0.1;

  const handleDChange = (value: string) => {
    setD(value);
    if (!hManual) {
      const d = num(value);
      if (d > 0) setH(defaultHeadHeight(kind, d));
    }
  };

  const handleHChange = (value: string) => {
    setHManual(true);
    setH(value);
  };

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title={methodologyTitle(kind)} />

      <section className="space-y-5">
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
              label="Внутренний диаметр днища"
              symbol="D"
              value={D}
              onChange={handleDChange}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Высота выпуклой части днища по внутренней поверхности без учета цилиндрической части"
              symbol="H"
              value={H}
              onChange={handleHChange}
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
              label="Расчётная температура"
              symbol="T"
              value={sigmaTemp}
              onChange={setSigmaTemp}
              unit="°C"
            />
            <CalcRow
              inColumn
              label="Коэффициент прочности продольного сварного шва"
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
            label="Радиус кривизны в вершине днища"
            symbol="R"
            value={displayR}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Расчётная толщина стенки днища"
            symbol={CALC_RESULT_SP_SYMBOL}
            value={displaySp}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Исполнительная толщина стенки днища"
            symbol={<CalcSymbol className="!text-xl">s</CalcSymbol>}
            value={displaySs}
            unit="мм"
            borderless
          />
        </CalcSection>

        <CalcSection title="Условия применимости расчетных формул" titleAccent={false}>
          {kind === "elliptical" ? (
            <>
              {hasResult ? (
                <CalcCheckRow ok={ellipticalThinOk}>
                  <Frac num={<>s − c</>} den="D" />
                  <span>= {fmtHundredthsRu(result.thinnessRatio)}</span>
                  <span>в пределах [0,002; 0,100]</span>
                </CalcCheckRow>
              ) : null}
              {geometryReady ? (
                <CalcCheckRow ok={ellipticalHeightOk}>
                  <Frac num="H" den="D" />
                  <span>= {fmtHundredthsRu(heightRatio)}</span>
                  <span>в пределах [0,2; 0,5]</span>
                </CalcCheckRow>
              ) : null}
            </>
          ) : hasResult ? (
            <CalcCheckRow ok={hemisphericalThinOk}>
              <Frac num={<>s − c</>} den="D" />
              <span>= {fmtHundredthsRu(result.thinnessRatio)}</span>
              <span>в пределах [0,0025; 0,100]</span>
            </CalcCheckRow>
          ) : null}
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
