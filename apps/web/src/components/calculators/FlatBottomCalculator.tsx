import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculateFlatBottom } from "@/lib/flatBottomGost34233";
import {
  FLAT_HEAD_TYPES_ALL,
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
  CALC_APPLICABILITY_TITLE,
  calcCheckCmp,
  calcInputClass,
} from "@/components/calculators/calculatorUi";
import { AllowSigma, Frac, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { fmt, fmtHundredths, fmtHundredthsRu, fmtRu, isBlank, num } from "@/lib/calcInputUtils";
import { cn } from "@/lib/utils";

const HOLE_COUNTS = [0, 1, 2, 3] as const;

export function FlatBottomCalculator({
  handbook,
  embedded = false,
}: {
  handbook: SteelHandbook;
  embedded?: boolean;
}) {
  const allowances = useAllowanceFields({ c1: "1.0", c2: "0.8", c3: "0" });
  const [attachmentType, setAttachmentType] = useState<FlatHeadAttachmentType>(1);
  const [D, setD] = useState("600");
  const [sShell, setSShell] = useState("10");
  const [cShell, setCShell] = useState("0");
  const [a, setA] = useState("17");
  const [r, setR] = useState("10");
  const [h1, setH1] = useState("10");
  const [gamma, setGamma] = useState("45");
  const [s2Groove, setS2Groove] = useState("8");
  const [D3, setD3] = useState("660");
  const [Dcp, setDcp] = useState("620");
  const [D2, setD2] = useState("580");
  const [holeCount, setHoleCount] = useState<(typeof HOLE_COUNTS)[number]>(0);
  const [d1, setD1] = useState("0");
  const [d2hole, setD2hole] = useState("0");
  const [d3hole, setD3hole] = useState("0");
  const [sigmaStr, setSigmaStr] = useState("140");
  const [sigmaTemp, setSigmaTemp] = useState("200");
  const sigma = num(sigmaStr, 140);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("1.6");
  const [s1, setS1] = useState("36");
  const [s2, setS2] = useState("10");

  const ccNum = num(allowances.cc);

  const result = useMemo(
    () =>
      calculateFlatBottom({
        attachmentType,
        D: num(D),
        sShell: num(sShell),
        cShell: num(cShell),
        holes:
          holeCount > 0
            ? {
                count: holeCount,
                diameters: [num(d1), num(d2hole), num(d3hole)],
              }
            : undefined,
        sigma,
        phiP: num(phiP, 1),
        p: num(p),
        s1: num(s1),
        s2: num(s2),
        allowances: {
          c1: num(allowances.c1),
          c2: num(allowances.c2),
          c31: 0,
          c32: 0,
          c33: 0,
          c3: num(allowances.c3),
          cc: ccNum,
        },
        geometry: {
          a: num(a),
          r: num(r),
          h1: num(h1),
          gammaDeg: num(gamma),
          s2Groove: num(s2Groove),
          D3: num(D3),
          Dcp: num(Dcp),
          D2: num(D2),
        },
      }),
    [
      attachmentType,
      D,
      sShell,
      cShell,
      a,
      r,
      h1,
      gamma,
      s2Groove,
      D3,
      Dcp,
      D2,
      holeCount,
      d1,
      d2hole,
      d3hole,
      sigma,
      phiP,
      p,
      s1,
      s2,
      allowances,
      ccNum,
    ]
  );

  const inputsReady = !isBlank(p) && num(D) > 0 && sigma > 0 && num(phiP, 1) > 0;
  const hasResult = inputsReady && result.error == null;

  const needsA = attachmentType === 1 || attachmentType === 2 || attachmentType === 6;
  const needsType9 = attachmentType === 9;
  const needsType10 = attachmentType === 10;
  const needsBolt = attachmentType === 11 || attachmentType === 12;
  const needsS2 = needsType10 || needsBolt;

  const content = (
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
        <div className="min-w-0 xl:col-span-2">
          <p className="mb-3 text-base font-semibold text-[var(--color-heading)]">Схема крепления</p>
          <FlatHeadSchemeSelector types={FLAT_HEAD_TYPES_ALL} value={attachmentType} onChange={setAttachmentType} />
        </div>
        <div className="min-w-0">
          <CalcRow inColumn label="Внутренний диаметр аппарата" symbol="D" value={D} onChange={setD} unit="мм" />
          <CalcRow
            inColumn
            label="Толщина цилиндрической части днища"
            symbol="s"
            value={sShell}
            onChange={setSShell}
            unit="мм"
          />
          <CalcRow inColumn label="Прибавка на коррозию обечайки" symbol="c" value={cShell} onChange={setCShell} unit="мм" />
          {needsA ? (
            <CalcRow inColumn label="Катет приварки днища" symbol="a" value={a} onChange={setA} unit="мм" />
          ) : null}
          {needsType9 ? (
            <>
              <CalcRow inColumn label="Высота цилиндрической части" symbol={<Var letter="h" sub="1" />} value={h1} onChange={setH1} unit="мм" />
              <CalcRow inColumn label="Радиус закругления" symbol="r" value={r} onChange={setR} unit="мм" />
            </>
          ) : null}
          {needsType10 ? (
            <>
              <CalcRow inColumn label="Толщина в зоне проточки" symbol={<Var letter="s" sub="2" />} value={s2Groove} onChange={setS2Groove} unit="мм" />
              <CalcRow inColumn label="Радиус закругления" symbol="r" value={r} onChange={setR} unit="мм" />
              <CalcRow inColumn label="Угол" symbol={<Var letter="γ" />} value={gamma} onChange={setGamma} unit="°" />
            </>
          ) : null}
          {needsBolt ? (
            <>
              {attachmentType === 11 ? (
                <CalcRow inColumn label="Диаметр болтовой окружности" symbol={<Var letter="D" sub="3" />} value={D3} onChange={setD3} unit="мм" />
              ) : (
                <CalcRow inColumn label="Средний диаметр прокладки" symbol={<Var letter="D" sub="с.п" />} value={Dcp} onChange={setDcp} unit="мм" />
              )}
              <CalcRow
                inColumn
                label="Наименьший наружный диаметр утонённой части"
                symbol={<Var letter="D" sub="2" />}
                value={D2}
                onChange={setD2}
                unit="мм"
              />
            </>
          ) : null}
          <CalcRow inColumn label="Расчётное внутреннее избыточное давление" symbol="p" value={p} onChange={setP} unit="МПа" />
          <CalcRow inColumn label="Расчётная температура" symbol="T" value={sigmaTemp} onChange={setSigmaTemp} unit="°C" />
          <CalcRow inColumn label="Коэффициент прочности сварных швов" symbol={<Var letter="φ" />} value={phiP} onChange={setPhiP} />
          <CalcRow
            inColumn
            label="Принятая номинальная толщина"
            symbol={<Var letter="s" sub="1" />}
            value={s1}
            onChange={setS1}
            unit="мм"
            borderless={!needsS2}
          />
          {needsS2 ? (
            <CalcRow
              inColumn
              label="Принятая толщина в зоне уплотнения / проточки"
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
            label="Допускаемое напряжение материала днища"
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

      <CalcSection title="Отверстия в днище" titleAccent={false}>
        <CalcRow inColumn label="Количество отверстий" symbol="" value={String(holeCount)} onChange={() => {}} unit="" borderless>
          <select
            className={cn(calcInputClass, "max-w-xs text-left")}
            value={holeCount}
            onChange={(e) => setHoleCount(Number(e.target.value) as (typeof HOLE_COUNTS)[number])}
          >
            {HOLE_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </CalcRow>
        {holeCount >= 1 ? (
          <CalcRow inColumn label="Диаметр отверстия 1" symbol={<Var letter="d" sub="1" />} value={d1} onChange={setD1} unit="мм" />
        ) : null}
        {holeCount >= 2 ? (
          <CalcRow inColumn label="Диаметр отверстия 2" symbol={<Var letter="d" sub="2" />} value={d2hole} onChange={setD2hole} unit="мм" />
        ) : null}
        {holeCount >= 3 ? (
          <CalcRow
            inColumn
            label="Диаметр отверстия 3"
            symbol={<Var letter="d" sub="3" />}
            value={d3hole}
            onChange={setD3hole}
            unit="мм"
            borderless
          />
        ) : null}
        {hasResult ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            K₀ = {fmtRu(result.k0, 3)}
            {result.k0Note ? ` — ${result.k0Note}` : null}
          </p>
        ) : null}
      </CalcSection>

      <CalcSection title="Результаты расчёта" titleAccent={false} twoColumns>
        <CalcRow
          label="Коэффициент конструкции"
          symbol="K"
          value={hasResult ? fmtRu(result.K, 3) : ""}
          variant="result"
          disabled
          unit=""
        />
        <CalcRow
          label="Расчётный диаметр"
          symbol={<Var letter="D" sub="p" />}
          value={hasResult ? fmt(result.Dp, 1) : ""}
          variant="result"
          disabled
          unit="мм"
        />
        <CalcRow
          label="Расчётная толщина плоского днища"
          symbol={<Var letter="s" sub="1ₚ" />}
          value={hasResult ? fmtHundredths(result.s1p) : ""}
          variant="result"
          disabled
          unit="мм"
        />
        <CalcRow
          label="Исполнительная толщина плоского днища"
          symbol={<Var letter="s" sub="1" />}
          value={hasResult ? fmtHundredths(result.s1Min) : ""}
          variant="result"
          disabled
          unit="мм"
        />
        {needsS2 ? (
          <CalcRow
            label="Минимальная толщина в зоне уплотнения / проточки"
            symbol={<Var letter="s" sub="2" />}
            value={hasResult ? fmtHundredths(result.s2Min) : ""}
            variant="result"
            disabled
            unit="мм"
          />
        ) : null}
      </CalcSection>

      <CalcSection title={CALC_APPLICABILITY_TITLE} titleAccent={false}>
        {hasResult && num(s1) > 0 ? (
          <CalcCheckRow ok={result.applicabilityOk}>
            <Frac num={<>s₁ − c</>} den={<Var letter="D" sub="p" />} />
            <span>= {fmtHundredthsRu(result.thinnessRatio)}</span>
            <span>{calcCheckCmp(result.applicabilityOk, "≤")} 0,11</span>
          </CalcCheckRow>
        ) : (
          <CalcCheckRow placeholder="Укажите s₁ для проверки" />
        )}
        {hasResult && num(s1) > 0 ? (
          <CalcCheckRow ok={result.shellThicknessOk}>
            <Var letter="s" sub="1" />
            <span>= {s1} мм</span>
            <span>{calcCheckCmp(result.shellThicknessOk, "≥")} {sShell} мм</span>
          </CalcCheckRow>
        ) : null}
        {needsS2 && hasResult && num(s2) > 0 ? (
          <CalcCheckRow ok={num(s2) >= result.s2Min}>
            <Var letter="s" sub="2" />
            <span>= {s2} мм</span>
            <span>{calcCheckCmp(num(s2) >= result.s2Min, "≥")} {fmtHundredths(result.s2Min)} мм</span>
          </CalcCheckRow>
        ) : null}
        {hasResult && num(s1) > 0 && !isBlank(p) ? (
          <CalcCheckRow ok={num(p) <= result.pAllow}>
            <Var letter="p" />
            <span>= {p} МПа</span>
            <span>{calcCheckCmp(num(p) <= result.pAllow, "≤")} {fmt(result.pAllow, 2)} МПа</span>
          </CalcCheckRow>
        ) : null}
      </CalcSection>

      {result.error ? (
        <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-4 py-2.5 text-sm text-[var(--color-destructive)]">
          {result.error}
        </p>
      ) : null}
    </section>
  );

  if (embedded) return content;

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title="Расчёт плоского круглого днища и крышки" />
      {content}
    </CalculatorPageShell>
  );
}
