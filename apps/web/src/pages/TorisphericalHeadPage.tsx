import { TorisphericalHeadInternalCalculator } from "@/components/calculators/TorisphericalHeadInternalCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

export function TorisphericalHeadPage() {
  return (
    <CalculatorHandbookPage>
      {(handbook) => <TorisphericalHeadInternalCalculator handbook={handbook} />}
    </CalculatorHandbookPage>
  );
}
