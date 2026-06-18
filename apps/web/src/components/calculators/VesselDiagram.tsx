import { useId } from "react";

function WavyBreakHorizontal({ x, y, width }: { x: number; y: number; width: number }) {
  const step = width / 3;
  return (
    <path
      d={`M ${x} ${y} q 3 4 ${step} 0 q 3 -4 ${step} 0 q 3 4 ${step} 0`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  );
}

export function VesselDiagram({
  diameter,
  thickness,
  length,
}: {
  diameter: number;
  thickness: number;
  length?: number;
}) {
  const patternId = useId();
  const lMm = length ?? Math.max(200, Math.round(diameter * 0.35));

  const centerX = 168;
  const innerR = 54;
  const sVis = 12;
  const innerRight = centerX + innerR;
  const outerRight = innerRight + sVis;
  const leftOuterX = centerX - innerR - sVis;

  const topY = 44;
  const bottomY = 206;
  const bodyH = bottomY - topY;

  const lDimX = leftOuterX - 30;
  const lCenterY = (topY + bottomY) / 2;
  const dDimY = 128;
  const sDimY = 68;
  const sLabelX = outerRight + 16;

  const dimSymbolClass =
    "fill-[var(--color-foreground)] text-[22px] font-serif font-bold italic";
  const dimValueClass =
    "fill-[var(--color-foreground)] text-[14px] font-semibold tabular-nums";
  const contourStroke = 2.25;

  const wavyW = 42;
  const wavyTopX = (leftOuterX + outerRight - wavyW) / 2;
  const wavyBottomX = wavyTopX;

  return (
    <svg
      viewBox="0 0 348 252"
      className="h-full w-full max-h-[300px] min-h-[220px] max-w-[360px] text-[var(--color-primary)]"
      aria-label="Схема цилиндрической обечайки"
    >
      <defs>
        <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1.2" />
        </pattern>
        <marker id={`${patternId}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="currentColor" />
        </marker>
        <marker id={`${patternId}-arrow-start`} markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto">
          <path d="M7,0 L0,3.5 L7,7 Z" fill="currentColor" />
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

      {/* контур обечайки */}
      <path
        d={`M ${leftOuterX} ${topY} H ${outerRight} V ${bottomY} H ${leftOuterX} Z`}
        fill="none"
        stroke="currentColor"
        strokeWidth={contourStroke}
      />
      <line
        x1={centerX}
        y1={topY}
        x2={innerRight}
        y2={topY}
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <line
        x1={centerX}
        y1={bottomY}
        x2={innerRight}
        y2={bottomY}
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* линии обрыва сверху и снизу */}
      <line x1={leftOuterX} y1={topY} x2={wavyTopX} y2={topY} stroke="currentColor" strokeWidth={contourStroke} />
      <WavyBreakHorizontal x={wavyTopX} y={topY - 1} width={wavyW} />
      <line x1={wavyTopX + wavyW} y1={topY} x2={outerRight} y2={topY} stroke="currentColor" strokeWidth={contourStroke} />

      <line x1={leftOuterX} y1={bottomY} x2={wavyBottomX} y2={bottomY} stroke="currentColor" strokeWidth={contourStroke} />
      <WavyBreakHorizontal x={wavyBottomX} y={bottomY - 1} width={wavyW} />
      <line
        x1={wavyBottomX + wavyW}
        y1={bottomY}
        x2={outerRight}
        y2={bottomY}
        stroke="currentColor"
        strokeWidth={contourStroke}
      />

      {/* ось симметрии */}
      <line
        x1={centerX}
        y1={topY - 10}
        x2={centerX}
        y2={bottomY + 12}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="10 5 2 5"
        opacity="0.75"
      />

      {/* l — слева, вертикально */}
      <line x1={leftOuterX} y1={topY} x2={lDimX} y2={topY} stroke="currentColor" strokeWidth="1" />
      <line x1={leftOuterX} y1={bottomY} x2={lDimX} y2={bottomY} stroke="currentColor" strokeWidth="1" />
      <line
        x1={lDimX}
        y1={topY}
        x2={lDimX}
        y2={bottomY}
        stroke="currentColor"
        strokeWidth="1.1"
        markerStart={`url(#${patternId}-arrow-start)`}
        markerEnd={`url(#${patternId}-arrow)`}
      />
      <text
        x={lDimX - 14}
        y={lCenterY}
        textAnchor="middle"
        transform={`rotate(-90 ${lDimX - 14} ${lCenterY})`}
        className={dimSymbolClass}
      >
        l
      </text>
      <text
        x={lDimX - 40}
        y={lCenterY}
        textAnchor="middle"
        transform={`rotate(-90 ${lDimX - 40} ${lCenterY})`}
        className={dimValueClass}
      >
        {lMm} мм
      </text>

      {/* D — от оси к внутренней стенке */}
      <line
        x1={centerX}
        y1={dDimY}
        x2={innerRight}
        y2={dDimY}
        stroke="currentColor"
        strokeWidth="1.1"
        markerEnd={`url(#${patternId}-arrow)`}
      />
      <text x={(centerX + innerRight) / 2} y={dDimY - 12} textAnchor="middle" className={dimSymbolClass}>
        D
      </text>
      <text x={(centerX + innerRight) / 2} y={dDimY + 22} textAnchor="middle" className={dimValueClass}>
        {diameter} мм
      </text>

      {/* s — толщина стенки, подпись справа вне контура */}
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
      <line
        x1={outerRight}
        y1={sDimY}
        x2={sLabelX - 2}
        y2={sDimY}
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <text x={sLabelX} y={sDimY + 5} textAnchor="start" className={dimSymbolClass}>
        s
      </text>
      <text x={sLabelX + 20} y={sDimY + 5} textAnchor="start" className={dimValueClass}>
        {thickness.toFixed(1)} мм
      </text>
    </svg>
  );
}
