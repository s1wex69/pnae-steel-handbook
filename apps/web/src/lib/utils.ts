import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let rowIdSeq = 0;

/** UUID для строк таблицы; работает и по http://192.168.x.x (не только localhost/https). */
export function newRowId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // Небезопасный контекст: доступ по IP в локальной сети без HTTPS
    }
  }
  rowIdSeq += 1;
  return `row-${Date.now().toString(36)}-${rowIdSeq.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Отображение числа с заданным округлением (0–10 знаков после запятой) */
export function formatDecimalPlaces(value: number, places: number): string {
  const p = Math.min(10, Math.max(0, Math.round(places)));
  return Number(value.toFixed(p)).toString();
}

/** @deprecated используйте formatDecimalPlaces */
export function formatInFinal(value: number): string {
  return formatDecimalPlaces(value, 5);
}
