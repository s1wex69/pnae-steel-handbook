export function VesselDiagram({
  diameter,
  thickness,
}: {
  diameter: number;
  thickness: number;
}) {
  const r = Math.min(80, diameter / 4);
  const s = Math.max(4, Math.min(20, thickness * 2));
  const cx = 120;
  const cy = 100;

  return (
    <svg
      viewBox="0 0 240 200"
      className="mx-auto w-full max-w-xs text-[var(--color-primary)]"
      aria-label="Схема цилиндрической обечайки"
    >
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
          />
        </pattern>
      </defs>
      <rect width="240" height="200" fill="url(#grid)" />
      <ellipse
        cx={cx}
        cy={cy - 50}
        rx={r + s}
        ry={12}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <rect
        x={cx - r - s}
        y={cy - 50}
        width={(r + s) * 2}
        height={100}
        fill="var(--color-muted)"
        stroke="currentColor"
        strokeWidth="2"
        rx="2"
      />
      <rect
        x={cx - r}
        y={cy - 50 + s}
        width={r * 2}
        height={100 - 2 * s}
        fill="var(--color-background)"
        opacity="0.6"
      />
      <ellipse
        cx={cx}
        cy={cy + 50}
        rx={r + s}
        ry={12}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <line
        x1={cx - r - s}
        y1={cy}
        x2={cx + r + s}
        y2={cy}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      <text x={cx} y={cy + 75} textAnchor="middle" className="fill-[var(--color-foreground)] text-[10px]">
        D = {diameter} мм
      </text>
      <text x={cx + r + s + 8} y={cy} className="fill-[var(--color-muted-foreground)] text-[9px]">
        s = {thickness.toFixed(1)} мм
      </text>
      <path
        d={`M ${cx + r} ${cy} L ${cx + r + s} ${cy}`}
        stroke="currentColor"
        strokeWidth="1"
        markerEnd="url(#arrow)"
      />
    </svg>
  );
}
