/** URL JSON справочника ПНАЭ (для Tilda: ./data/pnae-steel-properties.json) */
export function handbookDataUrl(): string {
  return import.meta.env.VITE_HANDBOOK_DATA ?? "/data/pnae-steel-properties.json";
}
