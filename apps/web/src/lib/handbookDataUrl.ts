function publicDataUrl(filename: string, envOverride?: string): string {
  if (envOverride) return envOverride;
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}data/${filename}`;
}

/** URL JSON справочника ПНАЭ */
export function handbookDataUrl(): string {
  return publicDataUrl("pnae-steel-properties.json", import.meta.env.VITE_HANDBOOK_DATA);
}

/** URL JSON справочника ГОСТ 34233.1 */
export function gostHandbookDataUrl(): string {
  return publicDataUrl(
    "gost34233-1-steel-properties.json",
    import.meta.env.VITE_GOST_HANDBOOK_DATA
  );
}
