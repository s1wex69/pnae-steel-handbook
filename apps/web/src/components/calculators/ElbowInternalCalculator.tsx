import { useEffect, useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculateElbow, type ElbowSteelClass } from "@/lib/elbow";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { CalcRow, ElbowAllowancesCalcSection } from "@/components/calculators/calculatorFields";
import {
  CalcCheckRow,
  CalcSection,
  CalculatorDiagramCard,
  CalculatorPageHeader,
  CalculatorPageShell,
  CALC_APPLICABILITY_TITLE,
  calcCheckCmp,
  calcInputClass,
} from "@/components/calculators/calculatorUi";
import { VesselDiagram } from "@/components/calculators/VesselDiagram";
import { AllowSigma, Var } from "@/components/handbooks/MathNotation";
import { useElbowAllowanceFields } from "@/hooks/useStresscalcAllowanceFields";
import { fmt, fmtHundredths, isBlank, num } from "@/lib/calcInputUtils";
import { cn } from "@/lib/utils";

const STEEL_OPTIONS: { value: ElbowSteelClass; label: string }[] = [
  { value: "carbon", label: "Углеродистая / кремнемарганцовистая" },
  { value: "crmov", label: "Хромомолибденванадиевая" },
  { value: "austenitic", label: "Аустенитная коррозионно-стойкая" },
];

export function ElbowInternalCalculator({ handbook }: { handbook: SteelHandbook }) {
  const allowances = useElbowAllowanceFields();
  const [Da, setDa] = useState("219");
  const [Rs, setRs] = useState("350");
  const [sigmaStr, setSigmaStr] = useState("130");
  const [sigmaTemp, setSigmaTemp] = useState("370");
  const [steelClass, setSteelClass] = useState<ElbowSteelClass>("carbon");
  const [ovalityA, setOvalityA] = useState("1.0");
  const sigma = num(sigmaStr, 130);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("1.6");
  const [s, setS] = useState("4");

  const daNum = num(Da);
  const rsNum = num(Rs);
  const phiPNum = num(phiP, 1);
  const pNum = num(p);
  const sNum = num(s);

  useEffect(() => {
    allowances.applyStresscalcDefaults(daNum, sNum, rsNum);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- пересчёт прибавок при смене геометрии
  }, [daNum, sNum, rsNum]);

  const result = useMemo(
    () =>
      calculateElbow({
        Da: daNum,
        Rs: rsNum,
        sigma,
        phi: phiPNum,
        p: pNum,
        s: sNum,
        temperatureC: num(sigmaTemp),
        steelClass,
        ovalityA: num(ovalityA),
        allowances: {
          c11: num(allowances.c11),
          c12: num(allowances.c12),
          c21: num(allowances.c21),
        },
      }),
    [allowances.c11, allowances.c12, allowances.c21, daNum, rsNum, sigma, phiPNum, pNum, sNum, sigmaTemp, steelClass, ovalityA]
  );

  const inputsReady = !isBlank(p) && daNum > 0 && rsNum > 0 && sigma > 0 && phiPNum > 0;
  const hasResult = inputsReady && result.error == null;
  const sUsed = sNum > 0 ? sNum : result.srcMax;

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title="Расчёт колена на внутреннее давление" />

      <section className="space-y-5">
        <ElbowAllowancesCalcSection
          collapsible
          c11={allowances.c11}
          c12={allowances.c12}
          c21={allowances.c21}
          onC11={allowances.setC11}
          onC12={allowances.setC12}
          onC21={allowances.setC21}
        />

        <CalcSection title="Исходные данные" titleAccent={false} twoColumns>
          <div className="min-w-0">
            <CalcRow
              inColumn
              label="Наружный диаметр колена"
              symbol={<Var letter="D" sub="a" />}
              value={Da}
              onChange={setDa}
              unit="мм"
            />
            <CalcRow
              inColumn
              label="Радиус изгиба колена (нейтральная ось)"
              symbol={<Var letter="R" sub="s" />}
              value={Rs}
              onChange={setRs}
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
              label="Расчётная температура стенки"
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
              label="Принятая номинальная толщина стенки"
              symbol={<Var letter="s" />}
              value={s}
              onChange={setS}
              unit="мм"
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
            <CalcRow inColumn label="Класс стали (для коэффициентов формы)" wide borderless>
              <select
                className={cn(calcInputClass, "text-left")}
                value={steelClass}
                onChange={(e) => setSteelClass(e.target.value as ElbowSteelClass)}
              >
                {STEEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </CalcRow>
          </div>
        </CalcSection>

        <CalcSection title="Расчётные толщины по зонам" titleAccent={false} twoColumns>
          <CalcRow
            variant="result"
            disabled
            label="Базовая толщина цилиндра sᵣ"
            symbol={<Var letter="s" sub="r" />}
            value={hasResult ? fmtHundredths(result.sr) : ""}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Внешняя сторона"
            symbol={<Var letter="s" sub="r1" />}
            value={hasResult ? fmtHundredths(result.sr1) : ""}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Внутренняя сторона"
            symbol={<Var letter="s" sub="r2" />}
            value={hasResult ? fmtHundredths(result.sr2) : ""}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Средняя часть (сечение A−A ±15°)"
            symbol={<Var letter="s" sub="r3" />}
            value={hasResult ? fmtHundredths(result.sr3) : ""}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Макс. толщина с прибавками max(sᵣᵢ + c)"
            symbol={<Var letter="s" />}
            value={hasResult ? fmtHundredths(result.srcMax) : ""}
            unit="мм"
          />
          <CalcRow
            variant="result"
            disabled
            label="Минимальная толщина стенки s − c₁₁ − c₁₂"
            symbol={<Var letter="s" sub="min" />}
            value={hasResult && sNum > 0 ? fmtHundredths(result.sMinWall) : ""}
            unit="мм"
            borderless
          />
        </CalcSection>

        <CalcSection title="Допускаемое давление" titleAccent={false} twoColumns>
          <CalcRow
            variant="result"
            disabled
            label="Внешняя сторона [p]₁"
            symbol="[p]"
            value={hasResult && sNum > 0 ? fmt(result.pAllow1, 1) : ""}
            unit="МПа"
          />
          <CalcRow
            variant="result"
            disabled
            label="Внутренняя сторона [p]₂"
            symbol="[p]"
            value={hasResult && sNum > 0 ? fmt(result.pAllow2, 1) : ""}
            unit="МПа"
          />
          <CalcRow
            variant="result"
            disabled
            label="Средняя часть [p]₃"
            symbol="[p]"
            value={hasResult && sNum > 0 ? fmt(result.pAllow3, 1) : ""}
            unit="МПа"
          />
          <CalcRow
            variant="result"
            disabled
            label="Допускаемое рабочее давление min([p]ᵢ)"
            symbol="[p]"
            value={hasResult && sNum > 0 && result.pAllow > 0 ? fmt(result.pAllow, 1) : ""}
            unit="МПа"
            borderless
          />
        </CalcSection>

        <CalcSection title={CALC_APPLICABILITY_TITLE} titleAccent={false}>
          {hasResult && sNum > 0 ? (
            <CalcCheckRow ok={result.thicknessOk}>
              <Var letter="s" />
              <span>= {s} мм</span>
              <span>{calcCheckCmp(result.thicknessOk, "≥")} {fmtHundredths(result.srcMax)} мм</span>
            </CalcCheckRow>
          ) : (
            <CalcCheckRow placeholder="Заполните исходные данные" />
          )}
          {hasResult && sNum > 0 && !isBlank(p) && result.pAllow > 0 ? (
            <CalcCheckRow ok={result.strengthOk}>
              <Var letter="p" />
              <span>= {p} МПа</span>
              <span>{calcCheckCmp(result.strengthOk, "≤")} {fmt(result.pAllow, 1)} МПа</span>
            </CalcCheckRow>
          ) : null}
        </CalcSection>
      </section>

      {result.error ? (
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-4 py-2.5 text-sm text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : null}

      <CalculatorDiagramCard>
        <VesselDiagram diameter={daNum || 219} thickness={sUsed > 0 ? sUsed : result.srcMax} outerDiameter />
      </CalculatorDiagramCard>
    </CalculatorPageShell>
  );
}
