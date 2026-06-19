import { useCallback, useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  calculateElbow,
  elbowSteelClassFromCategory,
  type ElbowSteelClass,
} from "@/lib/elbow";
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
import { fmtHundredths, isBlank, num } from "@/lib/calcInputUtils";

const METHODOLOGY_TITLE =
  "Расчёт толщины стенки колен, гибов и змеевиков, нагруженных внутренним давлением";

export function ElbowCalculator({ handbook }: { handbook: SteelHandbook }) {
  const allowances = useAllowanceFields();
  const [Rs, setRs] = useState("40");
  const [Da, setDa] = useState("200");
  const [daMax, setDaMax] = useState("90.2");
  const [daMin, setDaMin] = useState("89.9");
  const [sigmaStr, setSigmaStr] = useState("120");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigma = num(sigmaStr, 120);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("10");
  const [steelClass, setSteelClass] = useState<ElbowSteelClass>("carbon");

  const daNum = num(Da);
  const rsNum = num(Rs);
  const ccNum = num(allowances.cc);
  const phiPNum = num(phiP, 1);
  const tempNum = num(sigmaTemp);

  const handleSteelCategory = useCallback((categoryId: string | null) => {
    setSteelClass(elbowSteelClassFromCategory(categoryId));
  }, []);

  const result = useMemo(
    () =>
      calculateElbow({
        Da: daNum,
        Rs: rsNum,
        daMax: num(daMax),
        daMin: num(daMin),
        sigma,
        phiP: phiPNum,
        p: num(p),
        sp: 0,
        temperatureC: tempNum,
        steelClass,
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
    [allowances, daNum, rsNum, daMax, daMin, sigma, phiPNum, p, ccNum, tempNum, steelClass]
  );

  const inputsReady = !isBlank(p) && daNum > 0 && rsNum > 0 && sigma > 0 && phiPNum > 0;
  const hasResult = inputsReady && result.error == null;
  const displaySp = hasResult ? fmtHundredths(result.sp) : "";
  const displaySs = hasResult ? fmtHundredths(result.ss) : "";
  const displayPp = hasResult && result.pp > 0 ? fmtHundredths(result.pp) : "";

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
              label="Радиус изгиба колена по оси"
              symbol={<Var letter="R" sub="s" />}
              value={Rs}
              onChange={setRs}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Номинальный наружный диаметр цилиндрической части"
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
              labelExtra={
                <p className="mt-1 text-sm text-[var(--color-destructive)]">
                  *Обязательно укажите расчётную температуру и марку стали
                </p>
              }
            />
            <CalcRow
              inColumn
              label="Коэффициент снижения прочности"
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
                    onSteelCategoryChange={handleSteelCategory}
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

        <CalcSection title="Параметры для коэффициентов формы" titleAccent={false}>
          <CalcRow
            label="Максимальный наружный диаметр сечения колена"
            symbol={<Var letter="D" sub="amax" />}
            value={daMax}
            onChange={setDaMax}
            unit="мм"
          />
          <CalcRow
            label="Минимальный наружный диаметр сечения колена"
            symbol={<Var letter="D" sub="amin" />}
            value={daMin}
            onChange={setDaMin}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Овальность поперечного сечения колена"
            symbol="a"
            value={hasResult ? fmtHundredths(result.coeffs.a) : ""}
            unit="%"
          />
          <CalcRow
            variant="result"
            disabled
            label="Коэффициент b"
            symbol="b"
            value={hasResult ? fmtHundredths(result.coeffs.b) : ""}
          />
          <CalcRow
            variant="result"
            disabled
            label="Коэффициент q"
            symbol="q"
            value={hasResult ? fmtHundredths(result.coeffs.q) : ""}
            borderless
          />
        </CalcSection>

        <CalcSection title="Результаты расчёта" titleAccent={false}>
          <CalcRow
            variant="result"
            disabled
            label="Расчётная толщина (максимальная из зон)"
            symbol={CALC_RESULT_SP_SYMBOL}
            value={displaySp}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Расчётная толщина внешней стороны колена"
            symbol={<Var letter="s" sub="R1" />}
            value={hasResult ? fmtHundredths(result.sp1) : ""}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Расчётная толщина внутренней стороны колена"
            symbol={<Var letter="s" sub="R2" />}
            value={hasResult ? fmtHundredths(result.sp2) : ""}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Расчётная толщина нейтральной стороны колена (±15°)"
            symbol={<Var letter="s" sub="R3" />}
            value={hasResult ? fmtHundredths(result.sp3) : ""}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Номинальная толщина стенки колена"
            symbol={<CalcSymbol className="!text-2xl">s</CalcSymbol>}
            value={displaySs}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Допускаемое давление при проектировании"
            symbol="[p]"
            value={displayPp}
            unit="МПа"
            borderless
          />
        </CalcSection>

        <CalcSection title="Торовые коэффициенты и коэффициенты формы" titleAccent={false}>
          <CalcRow
            variant="result"
            disabled
            wideValue
            label="Торовые K₁, K₂, K₃"
            value={
              hasResult
                ? `${fmtHundredths(result.coeffs.K1)} / ${fmtHundredths(result.coeffs.K2)} / ${fmtHundredths(result.coeffs.K3)}`
                : ""
            }
          />
          <CalcRow
            variant="result"
            disabled
            wideValue
            label="Формы Y₁, Y₂, Y₃"
            value={
              hasResult
                ? `${fmtHundredths(result.coeffs.Y1)} / ${fmtHundredths(result.coeffs.Y2)} / ${fmtHundredths(result.coeffs.Y3)}`
                : ""
            }
          />
          <CalcRow
            variant="result"
            disabled
            label="K = max(Kᵢ·Yᵢ)"
            symbol="K"
            value={hasResult ? fmtHundredths(result.coeffs.K) : ""}
            borderless
          />
        </CalcSection>

        <CalcSection title="Условия применимости расчётных формул" titleAccent={false}>
          <div className="sm:col-span-2">
            <p className="text-base font-semibold sm:text-lg">
              <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
                <Frac num={<Var letter="R" sub="s" />} den={<Var letter="D" sub="a" />} />
                <span>≥ 1</span>
                <Frac num={<Var letter="R" sub="s" />} den={<Var letter="D" sub="a" />} />
                <span>= {fmtHundredths(result.rsRatio)}</span>
                <span
                  className={
                    result.applicabilityOk
                      ? "text-[var(--color-emphasis)]"
                      : "text-[var(--color-destructive)]"
                  }
                >
                  {result.applicabilityOk ? "Выполнено" : "Не выполнено"}
                </span>
              </span>
            </p>
          </div>
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
