import { BoltsStudsNutsCalculator } from "@/components/calculators/BoltsStudsNutsCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function BoltsStudsNutsPage() {
  return (
    <CalculatorHandbookPage>
      {(handbook) => <BoltsStudsNutsCalculator handbook={handbook} />}
    </CalculatorHandbookPage>
  );
}
