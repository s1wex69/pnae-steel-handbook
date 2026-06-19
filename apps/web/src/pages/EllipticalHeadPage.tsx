import { ConvexHeadInternalCalculator } from "@/components/calculators/ConvexHeadInternalCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function EllipticalHeadPage() {
  return (
    <CalculatorHandbookPage>
      {(handbook) => <ConvexHeadInternalCalculator handbook={handbook} kind="elliptical" />}
    </CalculatorHandbookPage>
  );
}
