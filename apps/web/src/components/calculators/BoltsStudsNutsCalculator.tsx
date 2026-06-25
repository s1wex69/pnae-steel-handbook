import { useEffect, useMemo, useState } from "react";

import type { SteelHandbook } from "@/types/steel";

import { calculateBoltsStudsNuts } from "@/lib/boltsStudsNuts";

import { AllowableStressFromHandbook } from "@/components/calculators/AllowableStressFromHandbook";
import { CalcRow } from "@/components/calculators/calculatorFields";

import {

  CalcCheckRow,

  CalcSection,

  CalculatorPageHeader,

  CalculatorPageShell,

} from "@/components/calculators/calculatorUi";

import { AllowSigma, Var } from "@/components/handbooks/MathNotation";
import { fmt, fmtHundredths, isBlank, num } from "@/lib/calcInputUtils";



export function BoltsStudsNutsCalculator({ handbook }: { handbook: SteelHandbook }) {
  const [D, setD] = useState("42");

  const [P, setP] = useState("4.5");

  const [dHole, setDHole] = useState("0");

  const [hNut, setHNut] = useState("42");

  const [z, setZ] = useState("16");

  const [F0w, setF0w] = useState("16000");

  const [Qw, setQw] = useState("0");

  const [sigmaStr, setSigmaStr] = useState("129.3");

  const [sigmaNutStr, setSigmaNutStr] = useState("129.3");

  const [rmtStr, setRmtStr] = useState("194");

  const [rmtNutStr, setRmtNutStr] = useState("194");

  const [sigmaTemp, setSigmaTemp] = useState("370");

  const [rmBolt, setRmBolt] = useState(0);

  const [rmNut, setRmNut] = useState(0);

  const [sameNutMaterial, setSameNutMaterial] = useState(true);

  const [lubricated, setLubricated] = useState(true);

  const [zeroTorque, setZeroTorque] = useState(false);

  const [flange1, setFlange1] = useState("60");

  const [flange2, setFlange2] = useState("60");

  const [gasket, setGasket] = useState("5");



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

        rmBolt,

        rmNut: sameNutMaterial ? rmBolt : rmNut,

        lubricated,

        zeroTighteningTorque: zeroTorque,
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

      rmBolt,

      rmNut,

      sameNutMaterial,

      lubricated,

      zeroTorque,
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

            <CalcRow

              inColumn

              inlineLabelExtra

              label="Допускаемое напряжение"

              labelExtra={

                <div className="mt-1.5">

                  <AllowableStressFromHandbook

                    handbook={handbook}

                    value={sigmaStr}

                    onChange={(n) => setSigmaStr(fmt(n, 1))}

                    embedded

                    pickersOnly

                    stacked

                    collapsibleSteelPickers

                    externalTemperature

                    temperature={sigmaTemp}

                    elementType="bolt"

                    rmt={rmtStr}

                    onRmtChange={setRmtStr}

                    onRmChange={setRmBolt}

                    defaultMark="35Х"
                  />

                </div>

              }

              symbol={<AllowSigma />}

              value={sigmaStr}

              onChange={setSigmaStr}

              unit="МПа"

            />

            <label className="flex items-center gap-2 text-base">

              <input type="checkbox" checked={sameNutMaterial} onChange={(e) => setSameNutMaterial(e.target.checked)} />

              Гайка — тот же материал

            </label>

            {!sameNutMaterial ? (

              <CalcRow

                inColumn

                inlineLabelExtra

                label="[σ] гайки"

                labelExtra={

                  <div className="mt-1.5">

                    <AllowableStressFromHandbook

                      handbook={handbook}

                      value={sigmaNutStr}

                      onChange={(n) => setSigmaNutStr(fmt(n, 1))}

                      embedded

                      pickersOnly

                      stacked

                      collapsibleSteelPickers

                      externalTemperature

                      temperature={sigmaTemp}

                      elementType="bolt"

                      rmt={rmtNutStr}

                      onRmtChange={setRmtNutStr}

                      onRmChange={setRmNut}

                      defaultMark="35Х"
                    />

                  </div>

                }

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



        <CalcSection title="Длина шпильки" titleAccent={false}>

          <CalcRow label="Толщина фланца 1" symbol={<Var letter="h" sub="ф1" />} value={flange1} onChange={setFlange1} unit="мм" />

          <CalcRow label="Толщина фланца 2" symbol={<Var letter="h" sub="ф2" />} value={flange2} onChange={setFlange2} unit="мм" />

          <CalcRow label="Толщина прокладки" symbol={<Var letter="h" sub="п" />} value={gasket} onChange={setGasket} unit="мм" />

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



        <CalcSection title="Результаты расчёта" titleAccent={false}>

          <CalcRow variant="result" disabled label="Усилие на один болт" symbol={<Var letter="F" />} value={hasResult ? fmt(result.F1w, 0) : ""} unit="Н" />

          <CalcRow variant="result" disabled label="Момент в шпильке при затяжке" symbol={<Var letter="M" sub="к" />} value={hasResult ? fmt(result.Mk / 1000, 1) : ""} unit="Н·м" />

          <CalcRow variant="result" disabled label="Момент на ключе" symbol={<Var letter="M" sub="кл" />} value={hasResult ? fmt(result.MklSimple / 1000, 1) : ""} unit="Н·м" />

          <CalcRow variant="result" disabled label="Напряжение растяжения" symbol={<Var letter="σ" sub="w" />} value={hasResult ? fmt(result.sigmaW, 1) : ""} unit="МПа" />

          <CalcRow variant="result" disabled label="Напряжение кручения" symbol={<Var letter="τ" sub="sw" />} value={hasResult ? fmt(result.tauSw, 1) : ""} unit="МПа" />

          <CalcRow variant="result" disabled label="Площадь по резьбе" symbol={<Var letter="A" />} value={hasResult ? fmt(result.Aw, 0) : ""} unit="мм²" />

          <CalcRow variant="result" disabled label="Требуемая площадь" symbol={<Var letter="A" sub="треб" />} value={hasResult ? fmt(result.AwRequired, 0) : ""} unit="мм²" borderless />

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

                  A ≥ A<sub>треб</sub> → {fmt(result.Aw, 0)} мм² {result.checks.area ? "≥" : "<"} {fmt(result.AwRequired, 0)} мм²

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


