import { ElbowInternalCalculator } from "@/components/calculators/ElbowInternalCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function ElbowInternalPage() {
  return (
    <CalculatorHandbookPage>
      {(handbook) => <ElbowInternalCalculator handbook={handbook} />}
    </CalculatorHandbookPage>
  );
}
