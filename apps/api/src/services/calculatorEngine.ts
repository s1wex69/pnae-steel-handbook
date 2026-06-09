import { z } from "zod";
import { parseDecimalPlaces, roundTo } from "../lib/round.js";
import { calculateAllowableStress } from "./allowableStressEngine.js";

export type CalcResponse = {
  inputs: Record<string, unknown>;
  results: Record<string, number | string | boolean | null>;
  formula: string;
  standard: string;
  units?: Record<string, string>;
  notes?: string[];
};

const num = z.coerce.number();
const nn = num.min(0);

export const calculatorHandlers: Record<
  string,
  (body: unknown) => CalcResponse
> = {
  "in-1-allowable-stress": (body) =>
    calculateAllowableStress(body) as unknown as CalcResponse,

  "in-2-wall-allowance": (body) => {
    const schema = z.object({
      corrosionRate: nn.default(0),
      serviceLife: nn.default(0),
      corrosionAllowance: nn.default(0),
      additionalAllowance: nn.default(0),
      negativeTolerance: nn.default(0),
    });
    const d = schema.parse(body);
    const decimalPlaces = parseDecimalPlaces(
      (body as Record<string, unknown>).decimalPlaces
    );
    const round = (v: number) => roundTo(v, decimalPlaces);
    const c1 =
      d.corrosionAllowance > 0
        ? d.corrosionAllowance
        : d.corrosionRate * d.serviceLife;
    const total = c1 + d.additionalAllowance + d.negativeTolerance;
    return {
      inputs: { ...d, decimalPlaces },
      results: {
        corrosionAllowance: round(c1),
        totalAllowance: round(total),
        designAllowance: round(c1 + d.additionalAllowance),
        decimalPlaces,
      },
      formula: "c = c₁ + c₂ + |c₃|",
      standard: "ИН № 2, ГОСТ 19903-74 / ГОСТ 25347-82",
      units: { thickness: "мм" },
      notes: ["c₁ — коррозия (или скорость × срок службы)", "c₂ — технологическая прибавка"],
    };
  },
};

export function calculateById(id: string, body: unknown): CalcResponse {
  const handler = calculatorHandlers[id];
  if (!handler) {
    throw new Error(`Калькулятор «${id}» не реализован`);
  }
  return handler(body);
}
