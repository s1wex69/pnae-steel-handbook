import { PnaeSteelLegend } from "@/components/handbooks/PnaeSteelLegend";

// ГОСТ 34233.1 пока использует тот же набор обозначений σ, σ13, σRV,
// поэтому для единообразия визуального стиля повторяем легенду ПНАЭ.
export function GostSteelLegend() {
  return <PnaeSteelLegend />;
}

