import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const math = "font-serif";

export function MathSpan({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn(math, className)}>{children}</span>;
}

export function Sub({ children }: { children: ReactNode }) {
  return <sub className="text-[0.72em] leading-none">{children}</sub>;
}

export function Sup({ children }: { children: ReactNode }) {
  return <sup className="text-[0.72em] leading-none">{children}</sup>;
}

/** [σ] — номинальное допускаемое напряжение */
export function AllowSigma({ sub }: { sub?: ReactNode }) {
  return (
    <MathSpan>
      [σ]{sub != null && <Sub>{sub}</Sub>}
    </MathSpan>
  );
}

/** σ или (σ) — напряжение; при grouped в скобках только σ, индекс снаружи */
export function Stress({ sub, grouped }: { sub?: ReactNode; grouped?: boolean }) {
  return (
    <MathSpan>
      {grouped ? "(σ)" : "σ"}
      {sub != null && <Sub>{sub}</Sub>}
    </MathSpan>
  );
}

/** Коэффициент запаса n_m, n_0,2, n_mt … */
export function SafetyN({ sub }: { sub: ReactNode }) {
  return <Var letter="n" sub={sub} />;
}

/** T (или K для α) над нижним индексом; нижний индекс на одной линии с буквой R. */
function StackedSubSup({ sub, sup }: { sub: ReactNode; sup: ReactNode }) {
  return (
    <span className="relative inline-block align-baseline leading-none">
      <span className="absolute bottom-full left-1/2 mb-px -translate-x-1/2 text-[0.62em] leading-none whitespace-nowrap">
        {sup}
      </span>
      <span className="text-[0.82em] leading-none">{sub}</span>
    </span>
  );
}

/** R_m, R_p0,2, n_mt и т.д. */
export function Var({
  letter,
  sub,
  sup,
  className,
}: {
  letter: string;
  sub?: ReactNode;
  sup?: ReactNode;
  className?: string;
}) {
  const stacked = sub != null && sup != null;

  return (
    <MathSpan className={cn(stacked && "inline-flex items-baseline", className)}>
      <span>{letter}</span>
      {stacked ? (
        <StackedSubSup sub={sub} sup={sup} />
      ) : (
        <>
          {sub != null && <Sub>{sub}</Sub>}
          {sup != null && <Sup>{sup}</Sup>}
        </>
      )}
    </MathSpan>
  );
}

function withBaselineUnit(symbol: ReactNode, suffix: ReactNode | null) {
  if (suffix == null) return <MathSpan>{symbol}</MathSpan>;
  return (
    <MathSpan className="inline-flex items-baseline">
      {symbol}
      <span>{suffix}</span>
    </MathSpan>
  );
}

export function Frac({
  num,
  den,
  className,
}: {
  num: ReactNode;
  den: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("mx-0.5 inline-flex flex-col items-center align-middle leading-tight", className)}>
      <span className="border-b border-current px-0.5 text-center">{num}</span>
      <span className="px-0.5 text-center">{den}</span>
    </span>
  );
}

export function MinExpr({ children }: { children: ReactNode }) {
  return (
    <MathSpan>
      min({children})
    </MathSpan>
  );
}

export function Times() {
  return <span className="mx-0.5">·</span>;
}

export function Or() {
  return <span className="mx-1 font-sans text-[0.92em]">или</span>;
}

/** 1,3[σ] — группа приведённых напряжений */
export function Sigma13() {
  return (
    <span>
      1,3
      <AllowSigma />
    </span>
  );
}

/** Единицы измерения с верхними индексами (как в ПНАЭ / ИН № 1) */
export function UnitText({ unit }: { unit: string }) {
  if (unit === "мкК⁻¹") {
    return (
      <>
        мкК<Sup>−1</Sup>
      </>
    );
  }
  if (unit === "10⁻⁶·°C⁻¹") {
    return (
      <>
        10<Sup>−6</Sup>·°C<Sup>−1</Sup>
      </>
    );
  }
  if (unit === "10⁻⁶·К⁻¹") {
    return (
      <>
        10<Sup>−6</Sup>·К<Sup>−1</Sup>
      </>
    );
  }
  return <>{unit}</>;
}

export type MechPropertyKey =
  | "rp02"
  | "rm"
  | "elasticModulusE"
  | "thermalExpansionAlpha"
  | "elongationA"
  | "reductionZ";

/** Заголовок столбца физико-механических характеристик */
export function MechPropertyHeader({
  propertyKey,
  unit = "",
}: {
  propertyKey: MechPropertyKey;
  unit?: string;
  atTemperature?: boolean;
}) {
  const suffix =
    unit.length > 0 ? (
      <>
        , <UnitText unit={unit} />
      </>
    ) : null;

  switch (propertyKey) {
    case "rp02":
      return withBaselineUnit(<Var letter="R" sub="p0,2" />, suffix);
    case "rm":
      return withBaselineUnit(<Var letter="R" sub="m" />, suffix);
    case "elasticModulusE":
      return withBaselineUnit(
        <MathSpan>
          <span>E</span>
        </MathSpan>,
        suffix
      );
    case "thermalExpansionAlpha":
    case "elongationA":
      return withBaselineUnit(
        <MathSpan>
          <span>α</span>
        </MathSpan>,
        suffix
      );
    case "reductionZ":
      return withBaselineUnit(
        <MathSpan>
          <span>Z</span>
        </MathSpan>,
        suffix
      );
  }
}

/** Расчётная температура */
export function TemperatureHeader() {
  return withBaselineUnit(<span>T</span>, <>, °C</>);
}
