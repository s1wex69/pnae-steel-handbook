import { PipeCollectorCalculator } from "@/components/calculators/PipeCollectorCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function PipeCollectorPage() {
  return <CalculatorHandbookPage>{(handbook) => <PipeCollectorCalculator handbook={handbook} />}</CalculatorHandbookPage>;
}
