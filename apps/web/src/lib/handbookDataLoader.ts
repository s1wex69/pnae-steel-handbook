import type { SteelHandbook } from "@/types/steel";
import { handbookDataUrl } from "./handbookDataUrl";

declare global {
  interface Window {
    __PNAE_B64_CHUNKS?: string[];
    __PNAE_HANDBOOK?: SteelHandbook;
  }
}

async function inflateGzipBase64(b64: string): Promise<SteelHandbook> {
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([binary]).stream().pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(stream).text();
  return JSON.parse(text) as SteelHandbook;
}

/** Загрузка справочника: из встроенных T123-чанков, fetch или кэша window */
export async function loadHandbookData(): Promise<SteelHandbook> {
  if (window.__PNAE_HANDBOOK) return window.__PNAE_HANDBOOK;

  const chunks = window.__PNAE_B64_CHUNKS;
  if (chunks?.length) {
    const data = await inflateGzipBase64(chunks.join(""));
    window.__PNAE_HANDBOOK = data;
    return data;
  }

  const res = await fetch(handbookDataUrl());
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as SteelHandbook;
  window.__PNAE_HANDBOOK = data;
  return data;
}
