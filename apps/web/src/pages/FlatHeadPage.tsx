import { useSearchParams } from "react-router-dom";
import { FlatHeadCalculator, type FlatHeadMode } from "@/components/calculators/FlatHeadCalculator";
import { CalculatorHandbookPage } from "@/pages/CalculatorHandbookPage";

function modeFromSearch(params: URLSearchParams): FlatHeadMode {
  return params.get("mode") === "cover" ? "cover" : "bottom";
}

export function FlatHeadPage() {
  const [searchParams] = useSearchParams();
  const initialMode = modeFromSearch(searchParams);

  return (
    <CalculatorHandbookPage>
      {(handbook) => <FlatHeadCalculator handbook={handbook} initialMode={initialMode} />}
    </CalculatorHandbookPage>
  );
}
