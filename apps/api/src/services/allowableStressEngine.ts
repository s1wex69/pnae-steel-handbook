import { z } from "zod";
import { parseDecimalPlaces, roundTo } from "../lib/round.js";
import {
  allowableStressModes,
  calculateIn1AllowableStress,
  type AllowableStressMode,
} from "../lib/in1AllowableStress.js";

export { allowableStressModes, type AllowableStressMode };

const schema = z.object({
  mode: z.enum(allowableStressModes),
  rm: z.number().positive(),
  rp02: z.number().positive(),
  rmt: z.number().positive().optional(),
  designTemperature: z.number().optional(),
  boltThresholdT: z.number().optional(),
  materialGroup: z.string().optional(),
  categoryId: z.string().optional(),
  decimalPlaces: z.coerce.number().int().min(0).max(10).optional(),
});

function roundResult<T>(value: T, decimalPlaces: number): T {
  const round = (v: number) => roundTo(v, decimalPlaces);
  if (typeof value !== "object" || value === null) {
    return (typeof value === "number" ? round(value) : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => roundResult(item, decimalPlaces)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "number") out[k] = round(v);
    else if (Array.isArray(v)) out[k] = roundResult(v, decimalPlaces);
    else if (typeof v === "object" && v !== null) out[k] = roundResult(v, decimalPlaces);
    else out[k] = v;
  }
  return out as T;
}

export function calculateAllowableStress(body: unknown) {
  const d = schema.parse(body);
  const decimalPlaces = parseDecimalPlaces(d.decimalPlaces);
  const result = calculateIn1AllowableStress({
    mode: d.mode,
    rm: d.rm,
    rp02: d.rp02,
    rmt: d.rmt,
    designTemperature: d.designTemperature,
    boltThresholdT: d.boltThresholdT,
    materialGroup: d.materialGroup,
    categoryId: d.categoryId,
  });

  return {
    ...roundResult(result, decimalPlaces),
    results: {
      ...roundResult(result.results, decimalPlaces),
      decimalPlaces,
    },
  };
}
