import { useId, type ReactNode } from "react";
import type { FlatHeadAttachmentType } from "@/lib/flatHeadTable4Gost34233";

/** Компактный viewBox — только геометрия, без размерных подписей */
const W = 108;
const H = 72;

const G = {
  axis: 98,
  si: 22,
  so: 36,
  headW: 50,
  headH: 14,
  yTop: 8,
  yBot: 64,
  yHead: 28,
} as const;

const hy1 = G.yHead + G.headH;
const stroke = 1.2;

type Ctx = { hatch: string };

function useHatchId() {
  return `${useId()}-h`;
}

function Defs({ hatch }: { hatch: string }) {
  return (
    <defs>
      <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="5" stroke="currentColor" strokeWidth="0.75" opacity="0.85" />
      </pattern>
    </defs>
  );
}

function Frame({ label, children }: { label: string; children: (ctx: Ctx) => ReactNode }) {
  const hatch = useHatchId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full text-[var(--color-foreground)]" aria-label={label}>
      <Defs hatch={hatch} />
      <Axis />
      {children({ hatch })}
    </svg>
  );
}

function Axis() {
  return (
    <line
      x1={G.axis}
      y1={6}
      x2={G.axis}
      y2={H - 4}
      stroke="currentColor"
      strokeWidth="0.7"
      strokeDasharray="5 3 1.5 3"
      opacity="0.5"
    />
  );
}

function Metal({ d, hatch }: { d: string; hatch: string }) {
  return <path d={d} fill={`url(#${hatch})`} stroke="currentColor" strokeWidth={stroke} strokeLinejoin="miter" />;
}

function Weld({ x, y, corner }: { x: number; y: number; corner: "tl" | "tr" | "bl" | "br" }) {
  const s = 6;
  const d =
    corner === "tl"
      ? `M${x} ${y} H${x + s} L${x} ${y + s} Z`
      : corner === "tr"
        ? `M${x} ${y} H${x - s} L${x} ${y + s} Z`
        : corner === "bl"
          ? `M${x} ${y} H${x + s} L${x} ${y - s} Z`
          : `M${x} ${y} H${x - s} L${x} ${y - s} Z`;
  return <path d={d} fill="currentColor" />;
}

function DrawWelded12({ type, hatch }: { type: 1 | 2; hatch: string }) {
  const shoulder = type === 1;
  const shell =
    shoulder
      ? `M${G.so} ${G.yTop} V${hy1} H${G.si + 10} V${hy1 + 8} H${G.so} V${G.yBot} H${G.si} V${G.yTop} Z`
      : `M${G.so} ${G.yTop} V${G.yBot} H${G.si} V${G.yTop} Z`;
  const head = `M${G.si} ${G.yHead} H${G.si + G.headW} V${hy1} H${G.si} Z`;
  return (
    <>
      <Metal d={shell} hatch={hatch} />
      <Metal d={head} hatch={hatch} />
      <Weld x={G.si} y={G.yHead} corner="tl" />
    </>
  );
}

function Draw34({ type, hatch }: { type: 3 | 4; hatch: string }) {
  const shell = `M${G.so} ${G.yTop} V${G.yBot} H${G.si} V${G.yTop} Z`;
  const head = `M${G.si} ${G.yHead} H${G.si + G.headW} V${hy1} H${G.si} Z`;
  return (
    <>
      <Metal d={shell} hatch={hatch} />
      <Metal d={head} hatch={hatch} />
      <Weld x={G.si} y={G.yHead} corner="tl" />
      {type === 4 && <Weld x={G.si} y={hy1} corner="bl" />}
    </>
  );
}

function Draw5({ hatch }: { hatch: string }) {
  const shellTop = G.yHead + G.headH;
  return (
    <>
      <Metal d={`M${G.so} ${shellTop} V${G.yBot} H${G.si} V${shellTop} Z`} hatch={hatch} />
      <Metal d={`M${G.si} ${G.yHead} H${G.si + G.headW} V${shellTop} H${G.si} Z`} hatch={hatch} />
      <Weld x={G.si} y={shellTop} corner="bl" />
    </>
  );
}

function Draw6({ hatch }: { hatch: string }) {
  const shellTop = G.yHead + G.headH;
  return (
    <>
      <Metal d={`M${G.so} ${shellTop} V${G.yBot} H${G.si} V${shellTop} Z`} hatch={hatch} />
      <Metal d={`M${G.si} ${G.yHead} H${G.si + G.headW} V${shellTop} H${G.si} Z`} hatch={hatch} />
      <Weld x={G.so} y={shellTop} corner="tr" />
    </>
  );
}

function Draw78({ type, hatch }: { type: 7 | 8; hatch: string }) {
  const shell = `M${G.so} ${G.yTop} V${G.yBot} H${G.si} V${G.yTop} Z`;
  const head =
    type === 7
      ? `M${G.si} ${G.yHead} H${G.si + G.headW} V${hy1} H${G.si} Z`
      : `M${G.si + 9} ${G.yHead} H${G.si + G.headW} V${hy1} H${G.si} V${G.yHead + 9} L${G.si + 9} ${G.yHead} Z`;
  return (
    <>
      <Metal d={shell} hatch={hatch} />
      <Metal d={head} hatch={hatch} />
      <Weld x={G.si} y={hy1} corner="bl" />
    </>
  );
}

function Draw9({ hatch }: { hatch: string }) {
  return (
    <>
      <Metal d={`M${G.so} ${G.yTop} V${G.yHead + 4} H${G.si} V${G.yTop} Z`} hatch={hatch} />
      <Metal
        d={`M${G.si} ${G.yHead + 4} H${G.si + G.headW - 4} V${hy1 + 2} H${G.si} V${G.yHead + 10} Q${G.si} ${G.yHead + 4} ${G.si + 7} ${G.yHead + 4} Z`}
        hatch={hatch}
      />
      <path
        d={`M${G.si + 3} ${G.yHead + 10} Q${G.si + 3} ${G.yHead + 5} ${G.si + 7} ${G.yHead + 4}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.65"
      />
    </>
  );
}

function Draw10({ hatch }: { hatch: string }) {
  const y0 = G.yHead + 2;
  return (
    <>
      <Metal d={`M${G.so} ${G.yTop} V${y0 + 2} H${G.si} V${G.yTop} Z`} hatch={hatch} />
      <Metal
        d={`M${G.si} ${y0} H${G.si + 12} L${G.si + 20} ${y0 + 8} V${hy1 + 4} H${G.si + G.headW} V${hy1 + 8} H${G.si} Z`}
        hatch={hatch}
      />
    </>
  );
}

function Draw11({ hatch }: { hatch: string }) {
  const fy = 40;
  const fh = 9;
  const hy = 24;
  const hh = 9;
  const boltX = G.si + 14;
  return (
    <>
      <Metal d={`M${G.so} ${fy + fh} V${G.yBot} H${G.si} V${fy + fh} Z`} hatch={hatch} />
      <Metal d={`M${G.si - 3} ${fy} H${G.so + 5} V${fy + fh} H${G.si - 3} Z`} hatch={hatch} />
      <Metal d={`M${G.si - 1} ${hy} H${G.si + G.headW + 2} V${hy + hh} H${G.si - 1} Z`} hatch={hatch} />
      <rect x={boltX - 2} y={hy + hh - 1} width={4} height={fy + fh - hy - hh + 2} fill="white" stroke="currentColor" strokeWidth="0.6" />
      <line x1={boltX} y1={8} x2={boltX} y2={G.yBot - 2} stroke="currentColor" strokeWidth="0.55" strokeDasharray="3 2" opacity="0.4" />
    </>
  );
}

function DrawGasket({ hatch }: { hatch: string }) {
  const cy = 38;
  const hh = 8;
  const fh = 6;
  return (
    <>
      <Metal d={`M${G.so} ${cy + hh + fh} V${G.yBot} H${G.si} V${cy + hh + fh} Z`} hatch={hatch} />
      <Metal d={`M${G.si - 2} ${cy + hh} H${G.so + 4} V${cy + hh + fh} H${G.si - 2} Z`} hatch={hatch} />
      <Metal d={`M${G.si - 1} ${cy - hh} H${G.si + G.headW} V${cy} H${G.si - 1} Z`} hatch={hatch} />
      <Metal d={`M${G.si - 2} ${cy} H${G.so + 4} V${cy + fh} H${G.si - 2} Z`} hatch={hatch} />
      <rect x={G.si + 10} y={cy - 1} width={5} height={hh + fh + 2} fill="white" stroke="currentColor" strokeWidth="0.55" />
    </>
  );
}

export function FlatHeadSchemeDiagram({ type }: { type: FlatHeadAttachmentType }) {
  return (
    <Frame label={`Схема: ${type}`}>
      {({ hatch }) => {
        switch (type) {
          case 1:
            return <DrawWelded12 type={1} hatch={hatch} />;
          case 2:
            return <DrawWelded12 type={2} hatch={hatch} />;
          case 3:
            return <Draw34 type={3} hatch={hatch} />;
          case 4:
            return <Draw34 type={4} hatch={hatch} />;
          case 5:
            return <Draw5 hatch={hatch} />;
          case 6:
            return <Draw6 hatch={hatch} />;
          case 7:
            return <Draw78 type={7} hatch={hatch} />;
          case 8:
            return <Draw78 type={8} hatch={hatch} />;
          case 9:
            return <Draw9 hatch={hatch} />;
          case 10:
            return <Draw10 hatch={hatch} />;
          case 11:
            return <Draw11 hatch={hatch} />;
          case 12:
            return <DrawGasket hatch={hatch} />;
          default:
            return null;
        }
      }}
    </Frame>
  );
}
