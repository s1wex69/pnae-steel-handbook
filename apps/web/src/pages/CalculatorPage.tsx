import { Link, useParams } from "react-router-dom";
import { CALCULATOR_CONFIGS } from "@/config/calculators";
import { GenericCalculator } from "@/components/calculators/GenericCalculator";
import { Button } from "@/components/ui/button";

export function CalculatorPage() {
  const { calculatorId } = useParams<{ calculatorId: string }>();
  const config = calculatorId ? CALCULATOR_CONFIGS[calculatorId] : undefined;

  if (!config) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--color-destructive)]">Калькулятор не найден</p>
        <Button variant="outline" asChild>
          <Link to="/calculators">← К списку</Link>
        </Button>
      </div>
    );
  }

  return <GenericCalculator config={config} />;
}
