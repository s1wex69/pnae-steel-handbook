import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { SteelHandbook } from "@/types/steel";
import { FlatBottomCalculator } from "@/components/calculators/FlatBottomCalculator";
import { FlatCoverCalculator } from "@/components/calculators/FlatCoverCalculator";
import { CalculatorPageHeader, CalculatorPageShell } from "@/components/calculators/calculatorUi";
import { cn } from "@/lib/utils";

export type FlatHeadMode = "bottom" | "cover";

const MODES = [
  {
    id: "bottom" as const,
    title: "Плоское круглое днище",
    subtitle: "§7.2",
    pageTitle: "Расчёт плоского круглого днища",
  },
  {
    id: "cover" as const,
    title: "Плоская круглая крышка с краевым моментом",
    subtitle: "§7.3",
    pageTitle: "Расчёт плоской круглой крышки с краевым моментом",
  },
] as const;

function FlatHeadModeSelector({
  mode,
  onChange,
}: {
  mode: FlatHeadMode;
  onChange: (mode: FlatHeadMode) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {MODES.map((option) => {
        const selected = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-colors",
              selected
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 ring-2 ring-[var(--color-primary)]/25"
                : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/40"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{option.subtitle}</p>
              <p className="mt-0.5 text-base font-semibold leading-snug text-[var(--color-heading)]">
                {option.title}
              </p>
            </div>
            <ChevronRight
              className={cn(
                "h-5 w-5 shrink-0",
                selected ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function FlatHeadCalculator({
  handbook,
  initialMode = "bottom",
}: {
  handbook: SteelHandbook;
  initialMode?: FlatHeadMode;
}) {
  const [mode, setMode] = useState<FlatHeadMode>(initialMode);
  const active = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <CalculatorPageShell>
      <CalculatorPageHeader title={active.pageTitle} />

      <div className="mb-8">
        <FlatHeadModeSelector mode={mode} onChange={setMode} />
      </div>

      <div className={mode === "bottom" ? undefined : "hidden"} aria-hidden={mode !== "bottom"}>
        <FlatBottomCalculator handbook={handbook} embedded />
      </div>
      <div className={mode === "cover" ? undefined : "hidden"} aria-hidden={mode !== "cover"}>
        <FlatCoverCalculator handbook={handbook} embedded />
      </div>
    </CalculatorPageShell>
  );
}
