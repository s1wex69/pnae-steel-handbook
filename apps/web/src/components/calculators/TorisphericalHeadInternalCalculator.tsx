import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculateTorisphericalHeadExternal } from "@/lib/torisphericalHeadGost34233";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { AllowancesCalcSection, CalcRow } from "@/components/calculators/calculatorFields";
import {
  CalcSection,
  CalculatorPageHeader,
  CalculatorPageShell,
  CALC_RESULT_SP_SYMBOL,
} from "@/components/calculators/calculatorUi";
import { AllowSigma, CalcSymbol, Frac, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { cn } from "@/lib/utils";
import { fmtHundredths, fmtHundredthsRu, isBlank, num } from "@/lib/calcInputUtils";

const METHODOLOGY_TITLE =
  "Расчёт на прочность торосферического днища, нагруженного внутренним избыточным давлением";

const INITIAL_D = "500";
const INITIAL_H = "125";

export function TorisphericalHeadInternalCalculator({ handbook }: { handbook: SteelHandbook }) {
  const allowances = useAllowanceFields();
  const [D, setD] = useState(INITIAL_D);
  const [H, setH] = useState(INITIAL_H);
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
      calculateTorisphericalHeadExternal({
        D: dNum,
        H: hNum,
        sigma,
        phi: phiPNum,
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
    [allowances, dNum, hNum, sigma, phiPNum, p, ccNum]
  );

  const inputsReady = !isBlank(p) && dNum > 0 && hNum > 0 && sigma > 0 && phiPNum > 0;
  const geometryReady = dNum > 0 && hNum > 0;
  const hasResult = inputsReady && result.error == null;
  const displaySp = hasResult ? fmtHundredths(result.sp) : "";
  const displaySs = hasResult ? fmtHundredths(result.ss) : "";

  const heightRatio = geometryReady ? hNum / dNum : 0;
  const thinOk = hasResult && result.thinOk;
  const heightOk = geometryReady && result.heightOk;

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title={METHODOLOGY_TITLE} />

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
              label="Внутренний диаметр днища"
              symbol="D"
              value={D}
              onChange={setD}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Высота выпуклой части днища по внутренней поверхности без учета цилиндрической части"
              symbol="H"
              value={H}
              onChange={setH}
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
            label="Расчётная толщина стенки днища"
            symbol={CALC_RESULT_SP_SYMBOL}
            value={displaySp}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Исполнительная толщина стенки днища"
            symbol={<CalcSymbol className="!text-2xl">s</CalcSymbol>}
            value={displaySs}
            unit="мм"
            borderless
          />
        </CalcSection>

        <CalcSection title="Условия применимости расчетных формул" titleAccent={false}>
          <div className="grid min-w-0 grid-cols-1 gap-6 sm:col-span-2 xl:grid-cols-2 xl:items-start">
            <div className="flex flex-col gap-2">
              <p className="text-base font-semibold sm:text-lg">
                <span className="inline-flex max-w-full flex-wrap items-center gap-x-2">
                  <span>0,0025</span>
                  <span>≤</span>
                  <Frac num={<>s − c</>} den="D" />
                  <span>≤</span>
                  <span>0,100</span>
                </span>
              </p>
              {hasResult ? (
                <>
                  <p className="text-base font-semibold tabular-nums sm:text-lg">
                    <span className="inline-flex max-w-full flex-wrap items-center gap-x-2">
                      <Frac num={<>s − c</>} den="D" />
                      <span>= {fmtHundredthsRu(result.thinnessRatio)}</span>
                    </span>
                  </p>
                  <p
                    className={cn(
                      "text-base font-semibold sm:text-lg",
                      thinOk ? "text-[var(--color-emphasis)]" : "text-[var(--color-destructive)]"
                    )}
                  >
                    {thinOk ? "Выполнено" : "Не выполнено"}
                  </p>
                </>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-base font-semibold sm:text-lg">
                <span className="inline-flex max-w-full flex-wrap items-center gap-x-2">
                  <span>0,2</span>
                  <span>≤</span>
                  <Frac num="H" den="D" />
                  <span>≤</span>
                  <span>0,5</span>
                </span>
              </p>
              {geometryReady ? (
                <>
                  <p className="text-base font-semibold tabular-nums sm:text-lg">
                    <span className="inline-flex max-w-full flex-wrap items-center gap-x-2">
                      <Frac num="H" den="D" />
                      <span>= {fmtHundredthsRu(heightRatio)}</span>
                    </span>
                  </p>
                  <p
                    className={cn(
                      "text-base font-semibold sm:text-lg",
                      heightOk ? "text-[var(--color-emphasis)]" : "text-[var(--color-destructive)]"
                    )}
                  >
                    {heightOk ? "Выполнено" : "Не выполнено"}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </CalcSection>
      </section>

      {result.error ? (
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-6 py-4 text-lg text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : hasResult && !result.pressureOk57 ? (
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-6 py-4 text-lg text-[var(--color-destructive)]">
          Расчётное внутреннее давление p превышает допустимое по формуле (57): [p] = {fmtHundredths(result.pp57)} МПа
        </p>
      ) : null}
    </CalculatorPageShell>
  );
}
