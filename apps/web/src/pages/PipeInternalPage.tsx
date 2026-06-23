import { PipeInternalCalculator } from "@/components/calculators/PipeInternalCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function PipeInternalPage() {
  return (
    <CalculatorHandbookPage>
      {(handbook) => <PipeInternalCalculator handbook={handbook} />}
    </CalculatorHandbookPage>
  );
}
