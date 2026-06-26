import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculateFlatCover } from "@/lib/flatCoverGost34233";
import {
  FLAT_HEAD_TYPES_COVER,
  type FlatHeadAttachmentType,
} from "@/lib/flatHeadTable4Gost34233";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { AllowancesCalcSection, CalcRow } from "@/components/calculators/calculatorFields";
import { FlatHeadSchemeSelector } from "@/components/calculators/FlatHeadSchemeSelector";
import {
  CalcCheckRow,
  CalcSection,
  CalculatorPageHeader,
  CalculatorPageShell,
} from "@/components/calculators/calculatorUi";
import { AllowSigma, Frac, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { fmt, fmtHundredths, fmtHundredthsRu, isBlank, num } from "@/lib/calcInputUtils";

export function FlatCoverCalculator({
  handbook,
  embedded = false,
}: {
  handbook: SteelHandbook;
  embedded?: boolean;
}) {
  const allowances = useAllowanceFields({ c1: "1.0", c2: "0.8", c3: "0" });
  const [attachmentType, setAttachmentType] = useState<FlatHeadAttachmentType>(11);
  const [D, setD] = useState("600");
  const [DpManual, setDpManual] = useState("600");
  const [D3, setD3] = useState("660");
  const [Dcp, setDcp] = useState("620");
  const [boltForce, setBoltForce] = useState("180");
  const [sShell] = useState("10");
  const [cShell] = useState("0");
  const [r, setR] = useState("10");
  const [k0, setK0] = useState("1");
  const [sigmaStr, setSigmaStr] = useState("140");
  const [sigmaTemp, setSigmaTemp] = useState("200");
  const sigma = num(sigmaStr, 140);
  const [p, setP] = useState("1.6");
  const [s1, setS1] = useState("28");
  const [s2, setS2] = useState("10");

  const ccNum = num(allowances.cc);
  const bolted = attachmentType === 11 || attachmentType === 12;

  const result = useMemo(
    () =>
      calculateFlatCover({
        attachmentType,
        D: num(D),
        D3: num(D3),
        Dcp: num(Dcp),
        boltForce: bolted ? num(boltForce) : 0,
        sShell: num(sShell),
        cShell: num(cShell),
        k0: num(k0, 1),
        sigma,
        p: num(p),
        s1: num(s1),
        allowances: {
          c1: num(allowances.c1),
          c2: num(allowances.c2),
          c31: 0,
          c32: 0,
          c33: 0,
          c3: num(allowances.c3),
          cc: ccNum,
        },
        geometry: { r: num(r) },
        dpOverride: num(DpManual) > 0 ? num(DpManual) : undefined,
      }),
    [attachmentType, D, DpManual, D3, Dcp, boltForce, sShell, cShell, r, k0, sigma, p, s1, allowances, ccNum, bolted]
  );

  const inputsReady = !isBlank(p) && num(D) > 0 && sigma > 0;
  const hasResult = inputsReady && result.error == null;
  const needsR = attachmentType === 9;

  const content = (
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
          <div className="min-w-0 xl:col-span-2">
            <p className="mb-3 text-base font-semibold text-[var(--color-heading)]">Схема крепления</p>
            <FlatHeadSchemeSelector types={FLAT_HEAD_TYPES_COVER} value={attachmentType} onChange={setAttachmentType} />
          </div>
          <div className="min-w-0">
            <CalcRow inColumn label="Внутренний диаметр аппарата" symbol="D" value={D} onChange={setD} unit="мм" />
            <CalcRow inColumn label="Расчётный диаметр крышки" symbol={<Var letter="D" sub="p" />} value={DpManual} onChange={setDpManual} unit="мм" />
            {needsR ? (
              <CalcRow inColumn label="Радиус выточки" symbol="r" value={r} onChange={setR} unit="мм" />
            ) : null}
            {bolted ? (
              <>
                <CalcRow inColumn label="Диаметр болтовой окружности" symbol={<Var letter="D" sub="3" />} value={D3} onChange={setD3} unit="мм" />
                <CalcRow inColumn label="Средний диаметр прокладки" symbol={<Var letter="D" sub="с.п" />} value={Dcp} onChange={setDcp} unit="мм" />
                <CalcRow inColumn label="Суммарное болтовое усилие" symbol={<Var letter="P" sub="б" />} value={boltForce} onChange={setBoltForce} unit="Н" />
              </>
            ) : null}
            <CalcRow inColumn label="Расчётное давление" symbol="p" value={p} onChange={setP} unit="МПа" />
            <CalcRow inColumn label="Расчётная температура" symbol="T" value={sigmaTemp} onChange={setSigmaTemp} unit="°C" />
            <CalcRow inColumn label="Коэффициент ослабления" symbol={<Var letter="K" sub="0" />} value={k0} onChange={setK0} />
            <CalcRow
              inColumn
              label="Принятая номинальная толщина"
              symbol={<Var letter="s" sub="1" />}
              value={s1}
              onChange={setS1}
              unit="мм"
              borderless={!bolted}
            />
            {bolted ? (
              <CalcRow
                inColumn
                label="Принятая толщина в зоне уплотнения"
                symbol={<Var letter="s" sub="2" />}
                value={s2}
                onChange={setS2}
                unit="мм"
                borderless
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <CalcRow
              inColumn
              inlineLabelExtra
              label="Допускаемое напряжение материала крышки"
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
            label="Расчётная толщина крышки"
            symbol={<Var letter="s" sub="1ₚ" />}
            value={hasResult ? fmtHundredths(result.s1p) : ""}
            variant="result"
            disabled
            unit="мм"
          />
          <CalcRow
            label="Исполнительная толщина крышки"
            symbol={<Var letter="s" sub="1" />}
            value={hasResult ? fmtHundredths(result.s1Min) : ""}
            variant="result"
            disabled
            unit="мм"
          />
          {bolted ? (
            <CalcRow
              label="Минимальная толщина в зоне уплотнения"
              symbol={<Var letter="s" sub="2" />}
              value={hasResult ? fmtHundredths(result.s2Min) : ""}
              variant="result"
              disabled
              unit="мм"
            />
          ) : null}
          <CalcRow
            label="Допускаемое давление"
            symbol="[p]"
            value={hasResult && num(s1) > 0 ? fmt(result.pAllow, 2) : ""}
            variant="result"
            disabled
            unit="МПа"
            borderless
          />
        </CalcSection>

        <CalcSection title="Проверки" titleAccent={false}>
          {hasResult && num(s1) > 0 ? (
            <CalcCheckRow ok={result.applicabilityOk}>
              <Frac num={<>s₁ − c</>} den={<Var letter="D" sub="p" />} />
              <span>= {fmtHundredthsRu(result.thinnessRatio)}</span>
              <span>{result.applicabilityOk ? "≤" : ">"} 0,11</span>
            </CalcCheckRow>
          ) : (
            <CalcCheckRow placeholder="Укажите s₁ для проверки" />
          )}
          {bolted && hasResult && num(s2) > 0 ? (
            <CalcCheckRow ok={num(s2) >= result.s2Min}>
              <span>
                s₂ ≥ s₂ min → s₂ = {s2} мм {num(s2) >= result.s2Min ? "≥" : "<"} {fmtHundredths(result.s2Min)} мм
              </span>
            </CalcCheckRow>
          ) : null}
          {hasResult && num(s1) > 0 && !isBlank(p) ? (
            <CalcCheckRow ok={num(p) <= result.pAllow}>
              <span>
                p ≤ [p] → {p} МПа {num(p) <= result.pAllow ? "≤" : ">"} {fmt(result.pAllow, 2)} МПа
              </span>
            </CalcCheckRow>
          ) : null}
        </CalcSection>

      {result.error ? (
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-6 py-4 text-lg text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : null}
    </section>
  );

  if (embedded) return content;

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title="Расчёт плоской круглой крышки с краевым моментом" />
      {content}
    </CalculatorPageShell>
  );
}
