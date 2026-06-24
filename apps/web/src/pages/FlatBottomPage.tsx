import { FlatBottomCalculator } from "@/components/calculators/FlatBottomCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function FlatBottomPage() {
  return (
    <CalculatorHandbookPage>
      {(handbook) => <FlatBottomCalculator handbook={handbook} />}
    </CalculatorHandbookPage>
  );
}
