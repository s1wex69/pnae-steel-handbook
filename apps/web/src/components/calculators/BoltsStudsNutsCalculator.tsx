import { useEffect, useMemo, useState } from "react";
import type { SteelHandbook } from "@/types/steel";
import {
  boltThresholdT,
  calculateBoltsStudsNuts,
  calcPnaeBoltAllowable,
} from "@/lib/boltsStudsNuts";
import { AllowancesCalcSection, CalcRow } from "@/components/calculators/calculatorFields";
import {
  CalcCheckRow,
  CalcSection,
  CalculatorPageHeader,
  CalculatorPageShell,
} from "@/components/calculators/calculatorUi";
import { MarkCombobox } from "@/components/handbooks/MarkCombobox";
import { StyledSelect } from "@/components/handbooks/SelectStep";
import { AllowSigma, Var } from "@/components/handbooks/MathNotation";
import { Label } from "@/components/ui/label";
import { useAllowanceFields } from "@/hooks/useAllowanceFields";
import {
  findCategoryIdForMark,
  findGrade,
  getAllMarks,
  getAllPnaeGroups,
  getSortamentsInGroups,
  groupsFromCategoryId,
  interpolatedValue,
} from "@/lib/steelHandbook";
import { fmt, fmtHundredths, isBlank, num } from "@/lib/calcInputUtils";

function useSteelGrade(
  handbook: SteelHandbook,
  mark: string,
  sortament: string,
  group: string,
  temperature: number
) {
  return useMemo(() => {
    if (!mark || !sortament || !group) return null;
    const grade = findGrade(handbook, group, mark, sortament);
    if (!grade) return null;
    const rm = interpolatedValue(grade, "rm", temperature);
    const rp02 = interpolatedValue(grade, "rp02", temperature);
    if (rm == null || rp02 == null) return null;
    return { grade, rm, rp02 };
  }, [handbook, mark, sortament, group, temperature]);
}

function SteelMaterialPicker({
  handbook,
  title,
  mark,
  setMark,
  sortament,
  setSortament,
  setGroup,
}: {
  handbook: SteelHandbook;
  title: string;
  mark: string;
  setMark: (v: string) => void;
  sortament: string;
  setSortament: (v: string) => void;
  setGroup: (v: string) => void;
}) {
  const marks = useMemo(() => getAllMarks(handbook), [handbook]);
  const activeMark = marks.includes(mark) ? mark : "";
  const categoryId = activeMark ? (findCategoryIdForMark(handbook, activeMark) ?? "") : "";
  const sortOpts = useMemo(() => {
    if (!activeMark) return [];
    const groups = categoryId ? groupsFromCategoryId(categoryId) : getAllPnaeGroups();
    return getSortamentsInGroups(handbook, groups, activeMark);
  }, [handbook, activeMark, categoryId]);

  useEffect(() => {
    if (!activeMark) return;
    const match = sortOpts.find((o) => o.sortament === sortament) ?? sortOpts[0];
    if (match) {
      setSortament(match.sortament);
      setGroup(match.group);
    } else {
      setSortament("");
      setGroup("");
    }
  }, [activeMark, sortOpts, sortament, setSortament, setGroup]);

  return (
    <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-3">
      <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{title}</p>
      <div className="space-y-2">
        <Label className="text-sm">Марка стали</Label>
        <MarkCombobox handbook={handbook} value={mark} onChange={setMark} placeholder="Поиск марки…" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Сортамент</Label>
        <StyledSelect
          hasValue={!!sortament}
          placeholder={activeMark ? "Выберите сортамент" : "Сначала марка"}
          value={sortament}
          disabled={!activeMark}
          className="h-11 text-base"
          onChange={(e) => {
            const s = e.target.value;
            const match = sortOpts.find((o) => o.sortament === s);
            setSortament(s);
            setGroup(match?.group ?? "");
          }}
        >
          {sortOpts.map((s) => (
            <option key={s.gradeName} value={s.sortament}>
              {s.sortament}
            </option>
          ))}
        </StyledSelect>
      </div>
    </div>
  );
}

export function BoltsStudsNutsCalculator({ handbook }: { handbook: SteelHandbook }) {
  const allowances = useAllowanceFields({ c1: "0", c2: "0.38", c3: "0" });
  const [D, setD] = useState("42");
  const [P, setP] = useState("4.5");
  const [dHole, setDHole] = useState("0");
  const [hNut, setHNut] = useState("42");
  const [z, setZ] = useState("16");
  const [F0w, setF0w] = useState("1603280");
  const [Qw, setQw] = useState("0");
  const [sigmaStr, setSigmaStr] = useState("129.3");
  const [sigmaNutStr, setSigmaNutStr] = useState("129.3");
  const [rmtStr, setRmtStr] = useState("194");
  const [sigmaTemp, setSigmaTemp] = useState("370");
  const [boltMark, setBoltMark] = useState("35Х");
  const [boltGroup, setBoltGroup] = useState("");
  const [boltSortament, setBoltSortament] = useState("");
  const [nutMark, setNutMark] = useState("35Х");
  const [nutGroup, setNutGroup] = useState("");
  const [nutSortament, setNutSortament] = useState("");
  const [sameNutMaterial, setSameNutMaterial] = useState(true);
  const [lubricated, setLubricated] = useState(true);
  const [zeroTorque, setZeroTorque] = useState(false);
  const [flange1, setFlange1] = useState("60");
  const [flange2, setFlange2] = useState("60");
  const [gasket, setGasket] = useState("5");

  const temperature = num(sigmaTemp, 370);
  const boltSteel = useSteelGrade(handbook, boltMark, boltSortament, boltGroup, temperature);
  const nutSteel = useSteelGrade(
    handbook,
    sameNutMaterial ? boltMark : nutMark,
    sameNutMaterial ? boltSortament : nutSortament,
    sameNutMaterial ? boltGroup : nutGroup,
    temperature
  );

  const categoryId = findCategoryIdForMark(handbook, boltMark) ?? "";
  const tt = boltThresholdT(categoryId, boltSteel?.grade.group ?? null);

  useEffect(() => {
    if (!boltSteel) return;
    const rmt = temperature > tt && num(rmtStr) > 0 ? num(rmtStr) : null;
    const allow = calcPnaeBoltAllowable(boltSteel.rp02, rmt, temperature, tt);
    if (allow?.sigma != null) setSigmaStr(fmt(allow.sigma, 1));
  }, [boltSteel, temperature, tt, rmtStr]);

  const nutCategoryId = findCategoryIdForMark(handbook, sameNutMaterial ? boltMark : nutMark) ?? "";
  const nutTt = boltThresholdT(nutCategoryId, nutSteel?.grade.group ?? null);

  useEffect(() => {
    if (!nutSteel) return;
    const rmt = temperature > nutTt && num(rmtStr) > 0 ? num(rmtStr) : null;
    const allow = calcPnaeBoltAllowable(nutSteel.rp02, rmt, temperature, nutTt);
    if (allow?.sigma != null) setSigmaNutStr(fmt(allow.sigma, 1));
  }, [nutSteel, temperature, nutTt, rmtStr, sameNutMaterial]);

  const sigma = num(sigmaStr, 129.3);
  const sigmaNut = sameNutMaterial ? sigma : num(sigmaNutStr, sigma);

  useEffect(() => {
    if (sameNutMaterial) setSigmaNutStr(sigmaStr);
  }, [sameNutMaterial, sigmaStr]);

  const result = useMemo(
    () =>
      calculateBoltsStudsNuts({
        D: num(D),
        P: num(P),
        dHole: num(dHole),
        hNut: num(hNut) > 0 ? num(hNut) : num(D),
        z: num(z, 1),
        F0w: num(F0w),
        Qw: num(Qw),
        sigma,
        sigmaNut,
        rmBolt: boltSteel?.rm ?? 0,
        rmNut: nutSteel?.rm ?? boltSteel?.rm ?? 0,
        lubricated,
        zeroTighteningTorque: zeroTorque,
        allowances: {
          c1: num(allowances.c1),
          c2: num(allowances.c2),
          c3: num(allowances.c3),
        },
        flange1: num(flange1),
        flange2: num(flange2),
        gasket: num(gasket),
      }),
    [
      D,
      P,
      dHole,
      hNut,
      z,
      F0w,
      Qw,
      sigma,
      sigmaNut,
      boltSteel,
      nutSteel,
      lubricated,
      zeroTorque,
      allowances,
      flange1,
      flange2,
      gasket,
    ]
  );

  const hasResult = result.error == null && num(z) > 0 && sigma > 0;

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title="Расчёт болтов, шпилек и гаек" />

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
            <CalcRow inColumn label="Номинальный диаметр резьбы" symbol={<Var letter="D" sub="0" />} value={D} onChange={setD} unit="мм" />
            <CalcRow inColumn label="Шаг резьбы" symbol={<Var letter="P" />} value={P} onChange={setP} unit="мм" />
            <CalcRow inColumn label="Диаметр отверстия в болте" symbol="d" value={dHole} onChange={setDHole} unit="мм" />
            <CalcRow inColumn label="Высота гайки" symbol={<Var letter="h" sub="г" />} value={hNut} onChange={setHNut} unit="мм" />
            <CalcRow inColumn label="Число болтов / шпилек" symbol="z" value={z} onChange={setZ} unit="шт." />
            <CalcRow inColumn label="Осевое усилие на все болты" symbol={<Var letter="F" sub="0w" />} value={F0w} onChange={setF0w} unit="Н" />
            <CalcRow inColumn label="Поперечное усилие на все болты" symbol={<Var letter="Q" sub="w" />} value={Qw} onChange={setQw} unit="Н" />
            <CalcRow inColumn label="Расчётная температура" symbol="T" value={sigmaTemp} onChange={setSigmaTemp} unit="°C" borderless />
          </div>
          <div className="min-w-0 space-y-3">
            <SteelMaterialPicker
              handbook={handbook}
              title="Болт / шпильки"
              mark={boltMark}
              setMark={setBoltMark}
              sortament={boltSortament}
              setSortament={setBoltSortament}
              setGroup={setBoltGroup}
            />
            <label className="flex items-center gap-2 text-base">
              <input type="checkbox" checked={sameNutMaterial} onChange={(e) => setSameNutMaterial(e.target.checked)} />
              Гайка — тот же материал
            </label>
            {!sameNutMaterial ? (
              <SteelMaterialPicker
                handbook={handbook}
                title="Гайка"
                mark={nutMark}
                setMark={setNutMark}
                sortament={nutSortament}
                setSortament={setNutSortament}
                setGroup={setNutGroup}
              />
            ) : null}
            {temperature > tt ? (
              <CalcRow
                inColumn
                label={`R_mt при T > ${tt} °C`}
                symbol={<Var letter="R" sub="mt" />}
                value={rmtStr}
                onChange={setRmtStr}
                unit="МПа"
              />
            ) : null}
            <CalcRow inColumn label="Допускаемое напряжение [σ]" symbol={<AllowSigma />} value={sigmaStr} onChange={setSigmaStr} unit="МПа" />
            {!sameNutMaterial ? (
              <CalcRow
                inColumn
                label="[σ] гайки"
                symbol={<><AllowSigma /><sub>г</sub></>}
                value={sigmaNutStr}
                onChange={setSigmaNutStr}
                unit="МПа"
              />
            ) : null}
            <CalcRow inColumn label="Смазка резьбы при затяжке" wide>
              <label className="flex items-center gap-2 text-base">
                <input type="checkbox" checked={lubricated} onChange={(e) => setLubricated(e.target.checked)} />
                Есть смазка (ζ = 0,13)
              </label>
            </CalcRow>
            <CalcRow inColumn label="Затяжка с разогревом / вытяжкой" wide borderless>
              <label className="flex items-center gap-2 text-base">
                <input type="checkbox" checked={zeroTorque} onChange={(e) => setZeroTorque(e.target.checked)} />
                Mк = 0
              </label>
            </CalcRow>
          </div>
        </CalcSection>

        <CalcSection title="Длина шпильки" titleAccent={false} twoColumns>
          <CalcRow inColumn label="Толщина фланца 1" symbol={<Var letter="h" sub="ф1" />} value={flange1} onChange={setFlange1} unit="мм" />
          <CalcRow inColumn label="Толщина фланца 2" symbol={<Var letter="h" sub="ф2" />} value={flange2} onChange={setFlange2} unit="мм" />
          <CalcRow inColumn label="Толщина прокладки" symbol={<Var letter="h" sub="п" />} value={gasket} onChange={setGasket} unit="мм" />
          <CalcRow
            variant="result"
            disabled
            label="Расчётная длина шпильки"
            symbol={<Var letter="L" sub="ш" />}
            value={hasResult ? fmtHundredths(result.studLength) : ""}
            unit="мм"
            borderless
          />
        </CalcSection>

        <CalcSection title="Результаты расчёта" titleAccent={false} twoColumns>
          <CalcRow variant="result" disabled label="Усилие на один болт" symbol={<Var letter="F" sub="1w" />} value={hasResult ? fmt(result.F1w, 0) : ""} unit="Н" />
          <CalcRow variant="result" disabled label="Момент в шпильке при затяжке" symbol={<Var letter="M" sub="к" />} value={hasResult ? fmt(result.Mk / 1000, 1) : ""} unit="Н·м" />
          <CalcRow variant="result" disabled label="Момент на ключе" symbol={<Var letter="M" sub="кл" />} value={hasResult ? fmt(result.MklSimple / 1000, 1) : ""} unit="Н·м" />
          <CalcRow variant="result" disabled label="Напряжение растяжения" symbol={<Var letter="σ" sub="w" />} value={hasResult ? fmt(result.sigmaW, 1) : ""} unit="МПа" />
          <CalcRow variant="result" disabled label="Напряжение кручения" symbol={<Var letter="τ" sub="sw" />} value={hasResult ? fmt(result.tauSw, 1) : ""} unit="МПа" />
          <CalcRow variant="result" disabled label="Площадь по резьбе Aw" symbol={<Var letter="A" sub="w" />} value={hasResult ? fmt(result.Aw, 0) : ""} unit="мм²" />
          <CalcRow variant="result" disabled label="Требуемая площадь Aw,треб" symbol={<Var letter="A" sub="w,треб" />} value={hasResult ? fmt(result.AwRequired, 0) : ""} unit="мм²" borderless />
        </CalcSection>

        <CalcSection title="Проверки" titleAccent={false}>
          {hasResult ? (
            <>
              <CalcCheckRow ok={result.checks.tension}>
                <span>σw ≤ [σ] → {fmt(result.sigmaW, 1)} МПа {result.checks.tension ? "≤" : ">"} {sigmaStr} МПа</span>
              </CalcCheckRow>
              <CalcCheckRow ok={result.checks.torsion}>
                <span>τsw ≤ [τ] → {fmt(result.tauSw, 1)} МПа {result.checks.torsion ? "≤" : ">"} {fmt(result.tauAllow, 1)} МПа</span>
              </CalcCheckRow>
              <CalcCheckRow ok={result.checks.threadBolt}>
                <span>
                  τₚ болта ≤ [τ] → {fmt(result.tauThreadBolt, 1)} МПа {result.checks.threadBolt ? "≤" : ">"}{" "}
                  {fmt(result.tauAllow, 1)} МПа
                </span>
              </CalcCheckRow>
              <CalcCheckRow ok={result.checks.threadNut}>
                <span>
                  τₚ гайки ≤ [τ]г → {fmt(result.tauThreadNut, 1)} МПа {result.checks.threadNut ? "≤" : ">"}{" "}
                  {fmt(result.tauNutAllow, 1)} МПа
                </span>
              </CalcCheckRow>
              {!isBlank(Qw) && num(Qw) > 0 ? (
                <>
                  <CalcCheckRow ok={result.checks.threadQw}>
                    <span>
                      Qw на резьбе ≤ [τ] → {fmt(result.tauThreadQw, 1)} МПа {result.checks.threadQw ? "≤" : ">"}{" "}
                      {fmt(result.tauAllow, 1)} МПа
                    </span>
                  </CalcCheckRow>
                  <CalcCheckRow ok={result.checks.bodyShear}>
                    <span>
                      Qw на теле ≤ [τ] → {fmt(result.tauBody, 1)} МПа {result.checks.bodyShear ? "≤" : ">"}{" "}
                      {fmt(result.tauAllow, 1)} МПа
                    </span>
                  </CalcCheckRow>
                </>
              ) : null}
              <CalcCheckRow ok={result.checks.area}>
                <span>
                  Aw ≥ Aw,треб → {fmt(result.Aw, 0)} мм² {result.checks.area ? "≥" : "<"} {fmt(result.AwRequired, 0)} мм²
                </span>
              </CalcCheckRow>
            </>
          ) : (
            <CalcCheckRow placeholder="Заполните исходные данные" />
          )}
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
