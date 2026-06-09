import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PnaeAllowableMode } from "@/lib/steelHandbook";
import type { AllowableStressMode } from "@intech-atom/in1";
import { AllowSigma, Sigma13, Stress } from "@/components/handbooks/MathNotation";

export type In1SymbolId =
  | "sigma"
  | "sigma_w"
  | "sigma_wt"
  | "sigma_c"
  | "sigma13"
  | "sigma_rv"
  | "sigma_rk"
  | "sigma_2";

export function in1SymbolIdForMode(
  mode: PnaeAllowableMode | AllowableStressMode
): In1SymbolId {
  switch (mode) {
    case "bolt":
      return "sigma_w";
    case "bolt_high_temp":
      return "sigma_wt";
    case "containment_shell":
      return "sigma_c";
    case "stress_range_equipment":
      return "sigma_rv";
    case "stress_range_piping":
      return "sigma_rk";
    default:
      return "sigma";
  }
}

export function In1Symbol({
  id,
  className,
}: {
  id: In1SymbolId;
  className?: string;
}) {
  const wrap = (node: ReactNode) => (
    <span className={cn("inline-flex items-baseline", className)}>{node}</span>
  );

  switch (id) {
    case "sigma":
      return wrap(<AllowSigma />);
    case "sigma_w":
      return wrap(<AllowSigma sub="w" />);
    case "sigma_wt":
      return wrap(<AllowSigma sub="wt" />);
    case "sigma_c":
      return wrap(<AllowSigma sub="c" />);
    case "sigma13":
      return wrap(<Sigma13 />);
    case "sigma_rv":
      return wrap(<Stress sub="RV" grouped />);
    case "sigma_rk":
      return wrap(<Stress sub="RK" grouped />);
    case "sigma_2":
      return wrap(<Stress sub={2} grouped />);
  }
}
