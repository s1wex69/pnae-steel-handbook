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

/** σ или (σ) — напряжение */
export function Stress({ sub, grouped }: { sub?: ReactNode; grouped?: boolean }) {
  return (
    <MathSpan>
      {grouped ? "(σ)" : "σ"}
      {sub != null && <Sub>{sub}</Sub>}
    </MathSpan>
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
  return (
    <MathSpan className={className}>
      {letter}
      {sub != null && <Sub>{sub}</Sub>}
      {sup != null && <Sup>{sup}</Sup>}
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

/** 1,3[σ] */
export function Sigma13() {
  return (
    <span>
      1,3<AllowSigma />
    </span>
  );
}

/** Единицы измерения с верхними индексами (как в ПНАЭ / ИН № 1) */
export function UnitText({ unit }: { unit: string }) {
  if (unit === "10⁻⁶·°C⁻¹") {
    return (
      <>
        10<Sup>−6</Sup>·°C<Sup>−1</Sup>
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
  atTemperature = false,
}: {
  propertyKey: MechPropertyKey;
  unit?: string;
  /** Верхний индекс T — значение при расчётной температуре (ИН № 1) */
  atTemperature?: boolean;
}) {
  const tempSup = atTemperature ? "T" : undefined;
  const suffix =
    unit.length > 0 ? (
      <>
        , <UnitText unit={unit} />
      </>
    ) : null;

  switch (propertyKey) {
    case "rp02":
      return (
        <>
          <Var letter="R" sub="p0,2" sup={tempSup} />
          {suffix}
        </>
      );
    case "rm":
      return (
        <>
          <Var letter="R" sub="m" sup={tempSup} />
          {suffix}
        </>
      );
    case "elasticModulusE":
      return (
        <>
          <MathSpan>
            E{tempSup != null && <Sup>{tempSup}</Sup>}
          </MathSpan>
          {suffix}
        </>
      );
    case "thermalExpansionAlpha":
    case "elongationA":
      return (
        <>
          <MathSpan>
            α{tempSup != null && <Sup>{tempSup}</Sup>}
          </MathSpan>
          {suffix}
        </>
      );
    case "reductionZ":
      return (
        <>
          <MathSpan>
            Z{tempSup != null && <Sup>{tempSup}</Sup>}
          </MathSpan>
          {suffix}
        </>
      );
  }
}

/** Расчётная температура */
export function TemperatureHeader() {
  return (
    <>
      <MathSpan>T</MathSpan>, °C
    </>
  );
}
