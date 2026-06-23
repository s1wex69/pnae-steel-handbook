import { ConicalShellInternalCalculator } from "@/components/calculators/ConicalShellInternalCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function ConicalShellInternalPage() {
  return (
    <CalculatorHandbookPage>
      {(handbook) => <ConicalShellInternalCalculator handbook={handbook} />}
    </CalculatorHandbookPage>
  );
}
