import { useId } from "react";

function formatDimMm(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function VesselDiagram({
  diameter,
  thickness,
  outerDiameter = false,
}: {
  diameter: number;
  thickness: number;
  /** Dₐ — наружный диаметр: размерная линия от оси до наружной грани стенки */
  outerDiameter?: boolean;
}) {
  const patternId = useId();

  const centerX = 168;
  const innerR = 54;
  const sVis = 12;
  const innerRight = centerX + innerR;
  const outerRight = innerRight + sVis;
  const leftOuterX = centerX - innerR - sVis;

  const topY = 44;
  const bottomY = 206;
  const bodyH = bottomY - topY;

  const sDimY = 68;
  const dDimY = 128;
  const dArrowEndX = outerDiameter ? outerRight : innerRight;
  const axisBottomY = bottomY + 12;

  const dimSymbolClass =
    "fill-[var(--color-foreground)] text-[26px] font-serif font-bold italic";
  const dimValueClass =
    "fill-[var(--color-foreground)] text-[16px] font-semibold tabular-nums";
  const contourStroke = 2.25;
  const sLabelX = outerRight + 16;

  return (
    <svg
      viewBox="0 0 348 252"
      className="h-full w-full max-h-[300px] min-h-[220px] max-w-[360px] text-[var(--color-primary)]"
      aria-label={outerDiameter ? "Схема трубы" : "Схема цилиндрической обечайки"}
    >
      <defs>
        <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1.2" />
        </pattern>
        <marker id={`${patternId}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="currentColor" />
        </marker>
      </defs>

      {/* правая стенка (сечение) */}
      <rect
        x={innerRight}
        y={topY}
        width={sVis}
        height={bodyH}
        fill={`url(#${patternId})`}
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* контур */}
      <path
        d={`M ${leftOuterX} ${topY} H ${outerRight} V ${bottomY} H ${leftOuterX} Z`}
        fill="none"
        stroke="currentColor"
        strokeWidth={contourStroke}
      />

      {/* ось симметрии */}
      <line
        x1={centerX}
        y1={topY - 10}
        x2={centerX}
        y2={axisBottomY}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="10 5 2 5"
        opacity="0.75"
      />

      {/* s — толщина стенки */}
      <line
        x1={innerRight - 8}
        y1={sDimY}
        x2={innerRight}
        y2={sDimY}
        stroke="currentColor"
        strokeWidth="1.1"
        markerEnd={`url(#${patternId}-arrow)`}
      />
      <line
        x1={outerRight + 8}
        y1={sDimY}
        x2={outerRight}
        y2={sDimY}
        stroke="currentColor"
        strokeWidth="1.1"
        markerEnd={`url(#${patternId}-arrow)`}
      />
      <text x={sLabelX} y={sDimY + 6} textAnchor="start" className={`${dimSymbolClass} text-[30px]`}>
        s
      </text>
      <text x={sLabelX + 20} y={sDimY + 5} textAnchor="start" className={dimValueClass}>
        {formatDimMm(thickness)} мм
      </text>

      {/* D / Dₐ */}
      <line
        x1={centerX}
        y1={dDimY}
        x2={dArrowEndX}
        y2={dDimY}
        stroke="currentColor"
        strokeWidth="1.1"
        markerEnd={`url(#${patternId}-arrow)`}
      />
      <text
        x={(centerX + dArrowEndX) / 2}
        y={dDimY - 12}
        textAnchor="middle"
        className={dimSymbolClass}
      >
        {outerDiameter ? (
          <>
            D<tspan baselineShift="sub" fontSize="18">a</tspan>
          </>
        ) : (
          "D"
        )}
      </text>
      <text
        x={(centerX + dArrowEndX) / 2}
        y={dDimY + 22}
        textAnchor="middle"
        className={dimValueClass}
      >
        {formatDimMm(diameter)} мм
      </text>
    </svg>
  );
}
