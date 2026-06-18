import { useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import { calculateElbow, type ElbowSteelClass } from "@/lib/elbow";
import type { ShellSolveTarget } from "@/lib/shellCalcShared";
import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { AllowancesCalcSection, CalcRow } from "@/components/calculators/calculatorFields";
import { CalcSection, CalculatorPageHeader, CalculatorPageShell } from "@/components/calculators/calculatorUi";
import { AllowSigma, Frac, Var } from "@/components/handbooks/MathNotation";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import { cn } from "@/lib/utils";
import { fmt, fmtIfSource, num } from "@/lib/calcInputUtils";

const STEEL_OPTIONS: { value: ElbowSteelClass; label: string }[] = [
  { value: "carbon", label: "Углеродистая / кремнемарганцовистая" },
  { value: "crmov", label: "Хромомолибденванадиевая" },
  { value: "austenitic", label: "Аустенитная коррозионно-стойкая" },
];

export function ElbowCalculator({ handbook }: { handbook: SteelHandbook }) {
  const a = useAllowanceFields();
  const [Da, setDa] = useState("219");
  const [Rs, setRs] = useState("300");
  const [sigmaStr, setSigmaStr] = useState("130");
  const [sigmaTemp, setSigmaTemp] = useState("20");
  const [steelClass, setSteelClass] = useState<ElbowSteelClass>("carbon");
  const [ovalityA, setOvalityA] = useState("0");
  const [filletR, setFilletR] = useState("0");
  const sigma = num(sigmaStr, 130);
  const [phiP, setPhiP] = useState("1");
  const [p, setP] = useState("10");
  const [sp, setSp] = useState("10");
  const [drive, setDrive] = useState<ShellSolveTarget>("p");

  const solveFor: ShellSolveTarget = drive === "p" ? "sp" : "p";

  const result = useMemo(
    () =>
      calculateElbow({
        Da: num(Da),
        Rs: num(Rs),
        sigma,
        phiP: num(phiP, 1),
        p: num(p),
        sp: num(sp),
        temperatureC: num(sigmaTemp),
        steelClass,
        ovalityA: num(ovalityA),
        filletR: num(filletR),
        solveFor,
        allowances: {
          c1: num(a.c1),
          c2: num(a.c2),
          c31: 0,
          c32: 0,
          c33: 0,
          c3: num(a.c3),
          cc: num(a.cc),
        },
      }),
    [Da, Rs, sigma, phiP, p, sp, sigmaTemp, steelClass, ovalityA, filletR, solveFor, a]
  );

  const displayP = drive === "p" ? p : fmtIfSource(result.p, sp, 2);
  const displaySp = drive === "sp" ? sp : fmtIfSource(result.sp, p);
  const pp = result.pp;

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader eyebrow="Калькулятор · ИН № 8" title="Колено — толщина стенки и допускаемое давление" />

      <section className="space-y-8">
        <AllowancesCalcSection
          c1={a.c1} c2={a.c2} c3={a.c3} cc={a.cc}
          onC1={a.setC1} onC2={a.setC2} onC3={a.setC3} onCc={a.setCc}
        />

        <CalcSection title="Исходные данные">
          <CalcRow label="Номинальный наружный диаметр D_a" symbol={<Var letter="D" sub="a" />} value={Da} onChange={setDa} unit="мм" />
          <CalcRow label="Радиус оси колена R_s" symbol={<Var letter="R" sub="s" />} value={Rs} onChange={setRs} unit="мм" />
          <CalcRow label="Расчётное давление" symbol="p" value={displayP} onFocus={() => setDrive("p")} onChange={(v) => { setDrive("p"); setP(v); }} unit="МПа" />
          <CalcRow
            label="Допускаемое напряжение"
            labelExtra={<div className="mt-1.5"><AllowableStressFromHandbook handbook={handbook} value={sigmaStr} onChange={(n) => setSigmaStr(String(n))} embedded pickersOnly stacked collapsibleSteelPickers externalTemperature temperature={sigmaTemp} onTemperatureChange={setSigmaTemp} /></div>}
            symbol={<AllowSigma />}
            value={sigmaStr}
            onChange={setSigmaStr}
            unit="МПа"
          />
          <CalcRow label="Температура стенки" symbol="T" value={sigmaTemp} onChange={setSigmaTemp} unit="°C" />
          <CalcRow label="Класс стали (для коэффициентов формы)" wide borderless>
            <select
              className="h-11 w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-lg"
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
          <CalcRow label="Овальность поперечного сечения a" symbol="a" value={ovalityA} onChange={setOvalityA} unit="%" />
          <CalcRow label="Радиус закругления внутренней поверхности r" symbol="r" value={filletR} onChange={setFilletR} unit="мм" />
          <CalcRow label="Коэффициент снижения прочности" symbol={<Var letter="φ" />} value={phiP} onChange={setPhiP} />
          <CalcRow label="Расчётная толщина (макс. из зон)" symbol={<Var letter="s" sub="R" />} value={displaySp} onFocus={() => setDrive("sp")} onChange={(v) => { setDrive("sp"); setSp(v); }} unit="мм" borderless />
        </CalcSection>

        <CalcSection title="Расчётные толщины по зонам">
          <CalcRow label="Внешняя сторона s_R1" symbol={<Var letter="s" sub="R1" />} value={fmt(result.sp1)} unit="мм" variant="result" disabled />
          <CalcRow label="Внутренняя сторона s_R2" symbol={<Var letter="s" sub="R2" />} value={fmt(result.sp2)} unit="мм" variant="result" disabled />
          <CalcRow label="Средняя часть s_R3" symbol={<Var letter="s" sub="R3" />} value={fmt(result.sp3)} unit="мм" variant="result" disabled borderless />
        </CalcSection>

        <CalcSection title="Коэффициенты">
          <CalcRow label="Торовые K1, K2, K3" symbol="" value={`${fmt(result.coeffs.K1, 3)} / ${fmt(result.coeffs.K2, 3)} / ${fmt(result.coeffs.K3, 3)}`} variant="result" disabled />
          <CalcRow label="Формы Y1, Y2, Y3" symbol="" value={`${fmt(result.coeffs.Y1, 3)} / ${fmt(result.coeffs.Y2, 3)} / ${fmt(result.coeffs.Y3, 3)}`} variant="result" disabled />
          <CalcRow label="K = max(K_i·Y_i)" symbol="K" value={fmt(result.coeffs.K, 3)} variant="result" disabled borderless />
        </CalcSection>

        <CalcSection title="Результаты">
          <CalcRow label="Номинальная толщина s = s_R + c" symbol="s" value={fmt(result.ss)} unit="мм" variant="result" disabled />
          <CalcRow label="Допускаемое давление" symbol="p" value={fmt(pp, 2)} unit="МПа" variant="result" disabled borderless />
        </CalcSection>

        <CalcSection title="Проверка применимости">
          <CalcRow label="Условие R_s / D_a ≥ 1" variant="check" borderless>
            <span className={cn("text-xl font-semibold tabular-nums", result.applicabilityOk ? "text-[var(--color-emphasis)]" : "text-[var(--color-destructive)]")}>
              <Frac num={<Var letter="R" sub="s" />} den={<Var letter="D" sub="a" />} /> = {fmt(result.rsRatio, 3)} {result.applicabilityOk ? "≥ 1" : "< 1"}
            </span>
          </CalcRow>
        </CalcSection>
      </section>

      {result.error ? <p className="rounded-2xl border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-6 py-4 text-lg text-[var(--color-destructive)]">{result.error}</p> : null}
    </CalculatorPageShell>
  );
}
