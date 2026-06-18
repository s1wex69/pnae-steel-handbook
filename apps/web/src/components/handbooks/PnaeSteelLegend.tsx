import type { ReactNode } from "react";
import { HandbookSectionHeading } from "@/components/handbooks/handbookTypography";
import { cn } from "@/lib/utils";
import { In1Symbol, type In1SymbolId } from "@/components/handbooks/In1Symbol";
import { MathSpan, Stress, Var } from "@/components/handbooks/MathNotation";

type TermSymbol = In1SymbolId | "Rp0,2" | "Rm" | "E" | "alpha_lin" | "alpha_el" | "Z";

type LegendTerm = {
  symbol: TermSymbol;
  title: ReactNode;
  description: ReactNode;
  wide?: boolean;
};

const LEGEND_TERMS: LegendTerm[] = [
  {
    symbol: "Rp0,2",
    title: "минимальное значение предела текучести при расчётной температуре, МПа",
    description:
      "Предел текучести — это минимальное механическое напряжение, при котором материал начинает деформироваться без увеличения нагрузки",
  },
  {
    symbol: "Rm",
    title: "Предел прочности (временное сопротивление), МПа",
    description:
      "Максимальное напряжение, которое материал может выдержать до своего полного разрушения",
  },
  {
    symbol: "E",
    title: "модуль упругости (модуль Юнга), ГПа",
    description:
      "Модуль упругости — показатель жёсткости материала, показывает напряжение, которое необходимо приложить к материалу, чтобы удлинить его в 2 раза",
  },
  {
    symbol: "alpha_lin",
    title: "Коэффициент температурного расширения материала, мкК⁻¹",
    description:
      "Характеризует относительную величину изменения линейных размеров тела с изменением температуры",
  },
  {
    symbol: "alpha_el",
    title: "Относительное удлинение",
    description:
      "Показатель пластичности материала, удлинение, отнесённое к первоначальной длине стержня",
  },
  {
    symbol: "Z",
    title: "Относительное сужение",
    description:
      "Отношение уменьшения площади поперечного сечения в месте разрыва к начальной площади поперечного образца",
  },
  {
    symbol: "sigma",
    title: "Номинальное допускаемое напряжение",
    description:
      "Отношение предельного напряжения для данного материала к коэффициенту запаса. В качестве некоторого предельного напряжения принимают — предел текучести, предел прочности или предел длительной прочности",
  },
  {
    symbol: "sigma13",
    title: (
      <>
        Расчетная группа категорий напряжений <Stress sub={2} grouped />
      </>
    ),
    description:
      "Допускаемое напряжение для оценки приведенных напряжений, определяемых по суммам составляющих общих или местных мембранных и общих изгибных напряжений",
  },
  {
    symbol: "sigma_rv",
    wide: true,
    title: (
      <>
        Расчетная группа категорий напряжений <Stress sub="RV" grouped />
      </>
    ),
    description:
      "Допускаемое напряжение для оценки размаха напряжений, определяемого по суммам составляющих общих или местных мембранных, общих или местных изгибных, общих температурных и компенсационных напряжений",
  },
];

function LegendSymbol({ symbol }: { symbol: TermSymbol }) {
  if (symbol === "Rp0,2") {
    return (
      <Var letter="R" sub="p0,2" className="text-[var(--color-emphasis)]" />
    );
  }
  if (symbol === "Rm") {
    return <Var letter="R" sub="m" className="text-[var(--color-emphasis)]" />;
  }
  if (symbol === "E") {
    return <MathSpan className="text-[var(--color-emphasis)]">E</MathSpan>;
  }
  if (symbol === "Z") {
    return <MathSpan className="text-[var(--color-emphasis)]">Z</MathSpan>;
  }
  if (symbol === "alpha_lin" || symbol === "alpha_el") {
    return <MathSpan className="text-[var(--color-emphasis)]">α</MathSpan>;
  }
  return <In1Symbol id={symbol} className="text-[var(--color-emphasis)]" />;
}

function LegendTermGrid({ terms }: { terms: LegendTerm[] }) {
  return (
    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
      {terms.map((t, i) => (
        <div
          key={`${t.symbol}-${i}`}
          className={cn(
            "min-w-0 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-muted)]/40 p-5 sm:p-6",
            t.wide && "sm:col-span-2"
          )}
        >
          <dt className="space-y-2">
            <div className="font-serif font-semibold text-[var(--color-emphasis)]">
              <LegendSymbol symbol={t.symbol} />
            </div>
            <div className="font-sans text-[var(--color-foreground)] leading-snug">{t.title}</div>
          </dt>
          <dd className="mt-3 font-sans text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {t.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PnaeSteelLegend() {
  return (
    <div className="min-w-0 max-w-full">
      <div className="rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)] px-5 py-7 shadow-[var(--shadow-card)] sm:px-10 sm:py-10">
        <HandbookSectionHeading id="pnae-steel-legend-heading">
          Условные обозначения
        </HandbookSectionHeading>

        <div className="mt-8">
          <LegendTermGrid terms={LEGEND_TERMS} />
        </div>
      </div>
    </div>
  );
}
