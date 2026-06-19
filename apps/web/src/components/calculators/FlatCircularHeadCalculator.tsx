import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  calculateFlatCircularHead,
  calcAllowablePressure,
  calcSsFromAllowablePressure,
  FLAT_HEAD_K0,
  FLAT_HEAD_K0_ALT_TYPE2,
  type FlatHeadConnectionType,
} from "@/lib/flatCircularHead";
import type { ShellSolveTarget } from "@/lib/shellCalcShared";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { AllowancesCalcSection, CalcRow } from "@/components/calculators/calculatorFields";
import { CalcSection, CalculatorPageHeader, CalculatorPageShell } from "@/components/calculators/calculatorUi";
import { AllowSigma, Frac, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { cn } from "@/lib/utils";
import { fmt, fmtIfSource, isBlank, num } from "@/lib/calcInputUtils";

const CONNECTION_LABELS: Record<FlatHeadConnectionType, string> = {
  1: "Тип 1 — D_R = D, K₀ = 0,53",
  2: "Тип 2 — D_R = D − r",
  3: "Тип 3 — D_R = D, K₀ = 0,47",
  4: "Тип 4 — D_R = D₄, K₀ = 0,6",
  5: "Тип 5 — D_R = D₂, K₀ = 0,45",
};

type ResultDrive = "ss" | "pp";

export function FlatCircularHeadCalculator({ handbook }: { handbook: SteelHandbook }) {
  const a = useAllowanceFields();
  const [connectionType, setConnectionType] = useState<FlatHeadConnectionType>(1);
  const [k0AltType2, setK0AltType2] = useState(false);
  const [isCover, setIsCover] = useState(false);
  const [D, setD] = useState("1000");
  const [r, setR] = useState("10");
  const [D2, setD2] = useState("800");
  const [D4, setD4] = useState("900");
  const [sShell, setSShell] = useState("12");
  const [s2, setS2] = useState("12");
  const [sigmaHeadStr, setSigmaHeadStr] = useState("130");
  const [sigmaShellStr, setSigmaShellStr] = useState("130");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const sigmaHead = num(sigmaHeadStr, 130);
  const sigmaShell = num(sigmaShellStr, 130);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("1.6");
  const [sp, setSp] = useState("30");
  const [drive, setDrive] = useState<ShellSolveTarget>("p");
  const [ss, setSs] = useState("");
  const [pp, setPp] = useState("");
  const [driveResult, setDriveResult] = useState<ResultDrive>("ss");

  const k0 = connectionType === 2 && k0AltType2 ? FLAT_HEAD_K0_ALT_TYPE2 : FLAT_HEAD_K0[connectionType];
  const solveFor: ShellSolveTarget = drive === "p" ? "sp" : "p";
  const ccNum = num(a.cc);

  const result = useMemo(
    () =>
      calculateFlatCircularHead({
        connectionType,
        k0,
        isCover,
        D: num(D),
        r: num(r),
        D2: num(D2),
        D4: num(D4),
        sigmaHead,
        sigmaShell,
        sShell: num(sShell),
        s2: num(s2),
        phiP: num(phiP, 1),
        p: num(p),
        sp: num(sp),
        solveFor,
        allowances: {
          c1: num(a.c1),
          c2: num(a.c2),
          c31: 0,
          c32: 0,
          c33: 0,
          c3: num(a.c3),
          cc: ccNum,
        },
      }),
    [connectionType, k0, isCover, D, r, D2, D4, sigmaHead, sigmaShell, sShell, s2, phiP, p, sp, solveFor, a, ccNum]
  );

  const thicknessInputBlank = isBlank(drive === "p" ? p : sp);
  const displayP = drive === "p" ? p : fmtIfSource(result.p, sp, 2);
  const displaySp = drive === "sp" ? sp : fmtIfSource(result.sp, p);

  const effectiveSs = useMemo(() => {
    if (driveResult === "ss") return isBlank(ss) ? 0 : num(ss);
    if (thicknessInputBlank) return 0;
    return (
      calcSsFromAllowablePressure(num(pp || fmt(result.pp, 2)), ccNum, result.DR, sigmaHead, num(phiP, 1), result.K4) ??
      result.ss
    );
  }, [driveResult, ss, pp, result.ss, result.pp, result.DR, result.K4, thicknessInputBlank, sigmaHead, phiP, ccNum]);

  const effectivePp = useMemo(() => {
    if (driveResult === "pp") return isBlank(pp) ? 0 : num(pp);
    if (thicknessInputBlank) return 0;
    return calcAllowablePressure(effectiveSs, ccNum, result.DR, sigmaHead, num(phiP, 1), result.K4) ?? result.pp;
  }, [driveResult, pp, effectiveSs, result.pp, result.DR, result.K4, thicknessInputBlank, sigmaHead, phiP, ccNum]);

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader eyebrow="Калькулятор · ИН № 9" title="Круглые плоские днища и крышки — толщина стенки и допускаемое давление" />

      <section className="space-y-8">
        <AllowancesCalcSection
          c1={a.c1} c2={a.c2} c3={a.c3} cc={a.cc}
          onC1={a.setC1} onC2={a.setC2} onC3={a.setC3} onCc={a.setCc}
        />

        <CalcSection title="Схема соединения">
          <CalcRow label="Тип соединения по табл. 1" wide>
            <select className="h-11 w-full max-w-xl rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-lg" value={connectionType} onChange={(e) => setConnectionType(Number(e.target.value) as FlatHeadConnectionType)}>
              {([1, 2, 3, 4, 5] as FlatHeadConnectionType[]).map((t) => (
                <option key={t} value={t}>{CONNECTION_LABELS[t]}</option>
              ))}
            </select>
          </CalcRow>
          {connectionType === 2 ? (
            <CalcRow label="K₀ = 0,47 (альтернатива 0,44)" wide>
              <label className="inline-flex items-center gap-2 text-lg">
                <input type="checkbox" checked={k0AltType2} onChange={(e) => setK0AltType2(e.target.checked)} />
                Использовать K₀ = 0,47
              </label>
            </CalcRow>
          ) : null}
          <CalcRow label="Крышка (x = 1)" wide borderless>
            <label className="inline-flex items-center gap-2 text-lg">
              <input type="checkbox" checked={isCover} onChange={(e) => setIsCover(e.target.checked)} />
              Расчёт крышки
            </label>
          </CalcRow>
        </CalcSection>

        <CalcSection title="Исходные данные">
          <CalcRow label="Внутренний диаметр обечайки D" symbol="D" value={D} onChange={setD} unit="мм" />
          {connectionType === 2 ? <CalcRow label="Радиус закругления r" symbol="r" value={r} onChange={setR} unit="мм" /> : null}
          {connectionType === 4 ? <CalcRow label="Расчётный диаметр D₄" symbol={<Var letter="D" sub="4" />} value={D4} onChange={setD4} unit="мм" /> : null}
          {connectionType === 5 ? <CalcRow label="Расчётный диаметр D₂" symbol={<Var letter="D" sub="2" />} value={D2} onChange={setD2} unit="мм" /> : null}
          {!isCover ? (
            <>
              <CalcRow label="Толщина обечайки s" symbol="s" value={sShell} onChange={setSShell} unit="мм" />
              <CalcRow label="Толщина элемента s₂ (типы 3, 5)" symbol={<Var letter="s" sub="2" />} value={s2} onChange={setS2} unit="мм" />
              <CalcRow label="[σ] обечайки" symbol={<AllowSigma />} value={sigmaShellStr} onChange={setSigmaShellStr} unit="МПа" />
            </>
          ) : null}
          <CalcRow label="Расчётное внутреннее избыточное давление" symbol="p" value={displayP} onFocus={() => setDrive("p")} onChange={(v) => { setDrive("p"); setP(v); }} unit="МПа" />
          <CalcRow
            label="[σ] материала днища / крышки"
            labelExtra={<div className="mt-1.5"><AllowableStressFromHandbook handbook={handbook} value={sigmaHeadStr} onChange={(n) => setSigmaHeadStr(String(n))} embedded pickersOnly stacked collapsibleSteelPickers externalTemperature temperature={sigmaTemp} onTemperatureChange={setSigmaTemp} /></div>}
            symbol={<AllowSigma />}
            value={sigmaHeadStr}
            onChange={setSigmaHeadStr}
            unit="МПа"
          />
          <CalcRow label="Расчётная температура" symbol="T" value={sigmaTemp} onChange={setSigmaTemp} unit="°C" />
          <CalcRow label="Коэффициент снижения прочности" symbol={<Var letter="φ" />} value={phiP} onChange={setPhiP} />
          <CalcRow label="Расчётная толщина s₁R" symbol={<Var letter="s" sub="1R" />} value={displaySp} onFocus={() => setDrive("sp")} onChange={(v) => { setDrive("sp"); setSp(v); }} unit="мм" borderless />
        </CalcSection>

        <CalcSection title="Промежуточные коэффициенты">
          <CalcRow label="Расчётный диаметр D_R" symbol={<Var letter="D" sub="R" />} value={fmt(result.DR, 1)} variant="result" disabled unit="мм" />
          <CalcRow label="Коэффициент жёсткости x" symbol="x" value={fmt(result.x, 3)} variant="result" disabled />
          <CalcRow label="K₄ = K₀·x" symbol={<Var letter="K" sub="4" />} value={fmt(result.K4, 3)} variant="result" disabled borderless />
        </CalcSection>

        <CalcSection title="Результаты">
          <CalcRow label="Номинальная толщина s₁" symbol={<Var letter="s" sub="1" />} value={driveResult === "ss" ? ss : thicknessInputBlank ? "" : fmt(effectiveSs)} onFocus={() => setDriveResult("ss")} onChange={(v) => { setDriveResult("ss"); setSs(v); }} unit="мм" />
          <CalcRow label="Допускаемое давление" symbol="p" value={driveResult === "pp" ? pp : thicknessInputBlank ? "" : fmt(effectivePp, 2)} onFocus={() => setDriveResult("pp")} onChange={(v) => { setDriveResult("pp"); setPp(v); }} unit="МПа" borderless />
        </CalcSection>

        <CalcSection title="Проверка применимости">
          <CalcRow label="(s₁ − c) / D_R ≤ 0,2" variant="check" borderless>
            <span className={cn("text-xl font-semibold tabular-nums", result.applicabilityOk ? "text-[var(--color-emphasis)]" : "text-[var(--color-destructive)]")}>
              <Frac num={<>s₁ − c</>} den={<Var letter="D" sub="R" />} /> = {fmt(result.thinnessRatio, 3)} {result.applicabilityOk ? "≤" : ">"} 0,2
            </span>
          </CalcRow>
        </CalcSection>
      </section>

      {result.error ? <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-6 py-4 text-lg text-[var(--color-destructive)]">{result.error}</p> : null}
    </CalculatorPageShell>
  );
}
