import type { ReactNode } from "react";
import { In1Symbol, type In1SymbolId } from "@/components/handbooks/In1Symbol";
import {
  FormulaBoltW,
  FormulaBoltWt,
  FormulaPressure,
  FormulaShell,
  FormulaSigma13Note,
  FormulaSigma2,
  FormulaStressRangeLimit,
  FormulaStressRangePnae,
} from "@/components/handbooks/In1Formulas";
import { MathSpan, MechPropertyHeader, Var } from "@/components/handbooks/MathNotation";

type TermSymbol = In1SymbolId | "Rp0,2" | "Rm" | "E" | "alpha_lin" | "alpha_el" | "Z";

const TERMS: {
  symbol: TermSymbol;
  title: string;
  description: ReactNode;
}[] = [
  {
    symbol: "Rp0,2",
    title: "Предел текучести",
    description:
      "Минимальное значение при расчётной температуре, МПа. При отсутствии площадки текучести — напряжение при остаточной деформации 0,2%.",
  },
  {
    symbol: "Rm",
    title: "Предел прочности",
    description:
      "Минимальное временное сопротивление при расчётной температуре, МПа.",
  },
  {
    symbol: "E",
    title: "Модуль упругости",
    description: (
      <>
        Связь напряжения и деформации <MathSpan>σ = Eε</MathSpan>, ГПа.
      </>
    ),
  },
  {
    symbol: "alpha_lin",
    title: "Коэффициент линейного расширения",
    description: "Относительное изменение линейных размеров с температурой, 10⁻⁶·°C⁻¹.",
  },
  {
    symbol: "alpha_el",
    title: "Относительное удлинение",
    description: "Пластическая деформация при разрушении образца, %.",
  },
  {
    symbol: "Z",
    title: "Относительное сужение",
    description: "Уменьшение площади поперечного сечения в месте разрушения, %.",
  },
  {
    symbol: "sigma",
    title: "Допускаемое напряжение",
    description: (
      <>
        <FormulaPressure /> — при T &gt; T<sub>t</sub> учитывается <Var letter="R" sub="mt" />.
      </>
    ),
  },
  {
    symbol: "sigma_w",
    title: "Допускаемое напряжение в болтах",
    description: (
      <>
        <FormulaBoltW /> — от давления или усилий затяжки.
      </>
    ),
  },
  {
    symbol: "sigma_wt",
    title: "Допускаемое напряжение в болтах при T > Tt",
    description: (
      <>
        <FormulaBoltWt /> — дополнительно при T &gt; T<sub>t</sub>.
      </>
    ),
  },
  {
    symbol: "sigma_c",
    title: "Допускаемое напряжение оболочек",
    description: (
      <>
        <FormulaShell /> — корпуса страховочных и защитных оболочек.
      </>
    ),
  },
  {
    symbol: "sigma13",
    title: "Группа приведённых напряжений",
    description: (
      <>
        <FormulaSigma2 /> (ПНАЭ Г-7-002-86). <FormulaSigma13Note />.
      </>
    ),
  },
  {
    symbol: "sigma_rv",
    title: "Размах напряжений — оборудование",
    description: (
      <>
        <FormulaStressRangePnae symbol="RV" />. Предельное значение:{" "}
        <FormulaStressRangeLimit symbol="RV" />.
      </>
    ),
  },
  {
    symbol: "sigma_rk",
    title: "Размах напряжений — трубопроводы",
    description: (
      <>
        <FormulaStressRangePnae symbol="RK" />. Предельное значение:{" "}
        <FormulaStressRangeLimit symbol="RK" />.
      </>
    ),
  },
];

function LegendSymbol({ symbol }: { symbol: TermSymbol }) {
  if (symbol === "Rp0,2") {
    return (
      <Var letter="R" sub="p0,2" sup="T" className="text-[var(--color-emphasis)]" />
    );
  }
  if (symbol === "Rm") {
    return <Var letter="R" sub="m" sup="T" className="text-[var(--color-emphasis)]" />;
  }
  if (symbol === "E") {
    return <MathSpan className="text-[var(--color-emphasis)]">E</MathSpan>;
  }
  if (symbol === "Z") {
    return <MathSpan className="text-[var(--color-emphasis)]">Z</MathSpan>;
  }
  if (symbol === "alpha_lin") {
    return <MechPropertyHeader propertyKey="thermalExpansionAlpha" />;
  }
  if (symbol === "alpha_el") {
    return <MechPropertyHeader propertyKey="elongationA" />;
  }
  return <In1Symbol id={symbol} className="text-[var(--color-emphasis)]" />;
}

export function PnaeSteelLegend() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-5">
      <h2 className="text-lg font-semibold text-[var(--color-heading)]">Условные обозначения</h2>
      <div className="mt-4 space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          {TERMS.map((t, i) => (
            <div key={`${t.symbol}-${t.title}-${i}`} className="rounded-lg bg-[var(--color-muted)]/50 p-4">
              <dt className="font-semibold leading-snug">
                <LegendSymbol symbol={t.symbol} />
                <span className="ml-2 font-sans text-[var(--color-foreground)]">— {t.title}</span>
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {t.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
