import { HemisphericalHeadCalculator } from "@/components/calculators/HemisphericalHeadCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function HemisphericalHeadPage() {
  return <CalculatorHandbookPage>{(handbook) => <HemisphericalHeadCalculator handbook={handbook} />}</CalculatorHandbookPage>;
}
