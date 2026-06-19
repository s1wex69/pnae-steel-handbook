import { useId } from "react";
import type { ConvexHeadKind } from "@/lib/convexHeadGost34233";

export function HeadDiagram({
  kind,
  diameter,
  height,
  thickness,
}: {
  kind: ConvexHeadKind | "torispherical";
  diameter: number;
  height: number;
  thickness: number;
}) {
  const patternId = useId();
  const D = Math.max(diameter, 1);
  const H = Math.max(height, D * (kind === "hemispherical" ? 0.5 : 0.25));
  const sVis = Math.max(8, Math.min(18, thickness > 0 ? thickness / 6 : 12));

  const leftX = 108;
  const rightX = 276;
  const baseY = 218;
  const crownY = baseY - (H / D) * 132 - (kind === "torispherical" ? 8 : 0);
  const midX = (leftX + rightX) / 2;
  const leftOuter = leftX - sVis;
  const rightOuter = rightX + sVis;
  const outerCrownY = crownY - sVis * 0.75;
  const wallH = baseY - crownY;
  const hCenterY = (baseY + crownY) / 2;

  const dimSymbolClass =
    "fill-[var(--color-foreground)] text-[22px] font-serif font-bold italic";
  const dimValueClass =
    "fill-[var(--color-foreground)] text-[14px] font-semibold tabular-nums";
  const contourStroke = 2.25;

  const innerDomePath = `M ${leftX} ${baseY} Q ${midX} ${crownY} ${rightX} ${baseY}`;
  const outerContourPath = `M ${leftOuter} ${baseY} Q ${midX} ${outerCrownY} ${rightOuter} ${baseY} Z`;

  const hDimX = 62;
  const hSymbolX = 44;
  const hValueX = 28;
  const sLabelX = rightOuter + 10;

  return (
    <svg
      viewBox="0 0 400 300"
      className="h-full w-full max-h-[300px] min-h-[220px] max-w-[400px] text-[var(--color-primary)]"
      aria-label="Схема днища"
    >
      <defs>
        <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1.2" />
        </pattern>
        <marker id={`${patternId}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="currentColor" />
        </marker>
      </defs>

      <rect
        x={leftOuter}
        y={crownY}
        width={sVis}
        height={wallH}
        fill={`url(#${patternId})`}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x={rightX}
        y={crownY}
        width={sVis}
        height={wallH}
        fill={`url(#${patternId})`}
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path d={innerDomePath} fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.55" />
      <path d={outerContourPath} fill="none" stroke="currentColor" strokeWidth={contourStroke} />

      <line
        x1={leftX}
        y1={baseY + 16}
        x2={rightX}
        y2={baseY + 16}
        stroke="currentColor"
        strokeWidth="1.1"
        markerStart={`url(#${patternId}-arrow)`}
        markerEnd={`url(#${patternId}-arrow)`}
      />
      <text x={midX} y={baseY + 36} textAnchor="middle" className={dimSymbolClass}>
        D
      </text>
      <text x={midX} y={baseY + 54} textAnchor="middle" className={dimValueClass}>
        {Math.round(D)} мм
      </text>

      <line
        x1={hDimX}
        y1={baseY}
        x2={hDimX}
        y2={crownY}
        stroke="currentColor"
        strokeWidth="1.1"
        markerStart={`url(#${patternId}-arrow)`}
        markerEnd={`url(#${patternId}-arrow)`}
      />
      <text
        x={hSymbolX}
        y={hCenterY}
        textAnchor="middle"
        transform={`rotate(-90 ${hSymbolX} ${hCenterY})`}
        className={dimSymbolClass}
      >
        H
      </text>
      <text
        x={hValueX}
        y={hCenterY}
        textAnchor="middle"
        transform={`rotate(-90 ${hValueX} ${hCenterY})`}
        className={dimValueClass}
      >
        {Math.round(H)} мм
      </text>

      <text x={sLabelX} y={hCenterY - 2} textAnchor="start" className={`${dimSymbolClass} text-[26px]`}>
        s
      </text>
      <text x={sLabelX + 16} y={hCenterY - 2} textAnchor="start" className={dimValueClass}>
        {thickness > 0 ? `${thickness.toFixed(1)} мм` : "—"}
      </text>
    </svg>
  );
}
