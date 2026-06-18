import { ElbowCalculator } from "@/components/calculators/ElbowCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function ElbowPage() {
  return <CalculatorHandbookPage>{(handbook) => <ElbowCalculator handbook={handbook} />}</CalculatorHandbookPage>;
}
