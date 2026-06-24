import { FlatCoverCalculator } from "@/components/calculators/FlatCoverCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function FlatCoverPage() {
  return (
    <CalculatorHandbookPage>
      {(handbook) => <FlatCoverCalculator handbook={handbook} />}
    </CalculatorHandbookPage>
  );
}
