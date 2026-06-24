import { useMemo, useState, type ReactNode } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculateElbow, type ElbowSteelClass } from "@/lib/elbow";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { AllowancesCalcSection, CalcRow } from "@/components/calculators/calculatorFields";
import {
  CalcCheckRow,
  CalcSection,
  CalculatorDiagramCard,
  CalculatorPageHeader,
  CalculatorPageShell,
} from "@/components/calculators/calculatorUi";
import { VesselDiagram } from "@/components/calculators/VesselDiagram";
import { AllowSigma, Frac, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { fmt, fmtHundredths, fmtHundredthsRu, isBlank, num } from "@/lib/calcInputUtils";

const STEEL_OPTIONS: { value: ElbowSteelClass; label: string }[] = [
  { value: "carbon", label: "Углеродистая / кремнемарганцовистая" },
  { value: "crmov", label: "Хромомолибденванадиевая" },
  { value: "austenitic", label: "Аустенитная коррозионно-стойкая" },
];

export function ElbowInternalCalculator({ handbook }: { handbook: SteelHandbook }) {
  const allowances = useAllowanceFields({ c1: "1.0", c2: "0.8", c3: "0" });
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

  const ccNum = num(allowances.cc);
  const daNum = num(Da);
  const rsNum = num(Rs);
  const phiPNum = num(phiP, 1);
  const pNum = num(p);
  const sNum = num(s);

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
          c1: num(allowances.c1),
          c2: num(allowances.c2),
          c31: 0,
          c32: 0,
          c33: 0,
          c3: num(allowances.c3),
          cc: ccNum,
        },
      }),
    [allowances, daNum, rsNum, sigma, phiPNum, pNum, sNum, sigmaTemp, steelClass, ovalityA, ccNum]
  );

  const inputsReady = !isBlank(p) && daNum > 0 && rsNum > 0 && sigma > 0 && phiPNum > 0;
  const hasResult = inputsReady && result.error == null;
  const sUsed = sNum > 0 ? sNum : result.sMin;

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title="Расчёт колена на внутреннее давление" />

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
              symbol={<CalcSymbol>s</CalcSymbol>}
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
                className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-lg"
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
            label="Минимальная номинальная толщина s ≥ max(sᵣ) + c"
            symbol={<CalcSymbol>s</CalcSymbol>}
            value={hasResult ? fmtHundredths(result.sMin) : ""}
            unit="мм"
            borderless
          />
        </CalcSection>

        <CalcSection title="Допускаемое давление" titleAccent={false} twoColumns>
          <CalcRow
            variant="result"
            disabled
            label="При проектировании"
            symbol="[p]"
            value={hasResult && sNum > 0 ? fmt(result.pAllowDesign, 3) : ""}
            unit="МПа"
          />
          <CalcRow
            variant="result"
            disabled
            label="После изготовления"
            symbol="[p]"
            value={hasResult && sNum > 0 ? fmt(result.pAllowMfg, 3) : ""}
            unit="МПа"
            borderless
          />
        </CalcSection>

        <CalcSection title="Проверки" titleAccent={false}>
          {hasResult ? (
            <CalcCheckRow ok={result.rsApplicabilityOk}>
              <Frac num={<Var letter="R" sub="s" />} den={<Var letter="D" sub="a" />} />
              <span>= {fmtHundredthsRu(result.rsRatio)}</span>
              <span>{result.rsApplicabilityOk ? "≥" : "<"} 1</span>
            </CalcCheckRow>
          ) : (
            <CalcCheckRow placeholder="Заполните исходные данные" />
          )}
          {hasResult && sNum > 0 ? (
            <CalcCheckRow ok={result.thinnessOk}>
              <Frac num={<>s − c</>} den={<Var letter="D" sub="a" />} />
              <span>= {fmtHundredthsRu(result.thinnessRatio)}</span>
              <span>{result.thinnessOk ? "≤" : ">"} 0,25</span>
            </CalcCheckRow>
          ) : null}
          {hasResult && sNum > 0 ? (
            <CalcCheckRow ok={result.thicknessOk}>
              <span>
                s ≥ max(sᵣ) + c → {s} мм {result.thicknessOk ? "≥" : "<"} {fmtHundredths(result.sMin)} мм
              </span>
            </CalcCheckRow>
          ) : null}
          {hasResult && sNum > 0 && !isBlank(p) ? (
            <CalcCheckRow ok={result.strengthOk}>
              <span>
                p ≤ [p] → {p} МПа {result.strengthOk ? "≤" : ">"} {fmt(result.pAllowDesign, 3)} МПа
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

      <CalculatorDiagramCard>
        <VesselDiagram diameter={daNum || 219} thickness={sUsed > 0 ? sUsed : result.sMin} />
      </CalculatorDiagramCard>
    </CalculatorPageShell>
  );
}

function CalcSymbol({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={className ?? "!text-2xl font-semibold"}>{children}</span>;
}
