import { FlatCircularHeadCalculator } from "@/components/calculators/FlatCircularHeadCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function FlatCircularHeadPage() {
  return <CalculatorHandbookPage>{(handbook) => <FlatCircularHeadCalculator handbook={handbook} />}</CalculatorHandbookPage>;
}
