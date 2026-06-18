export type EmbedBlockReason = "direct" | "forbidden-host";

export type EmbedAccess =
  | { allowed: true }
  | { allowed: false; reason: EmbedBlockReason; referrerHost?: string };

const DEFAULT_ALLOWED_HOSTS = [
  "*.tilda.ws",
  "*.tilda.cc",
  "intech-atom.ru",
  "www.intech-atom.ru",
  "localhost",
  "127.0.0.1",
];

export function isEmbedGuardEnabled(): boolean {
  return import.meta.env.VITE_EMBED_GUARD === "true";
}

function parseAllowedHosts(raw: string | undefined): string[] {
  if (!raw?.trim()) return DEFAULT_ALLOWED_HOSTS;
  return raw
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
}

function hostMatches(hostname: string, pattern: string): boolean {
  const host = hostname.toLowerCase();
  const pat = pattern.toLowerCase();

  if (pat.startsWith("*.")) {
    const base = pat.slice(2);
    return host === base || host.endsWith(`.${base}`);
  }

  return host === pat;
}

function isAllowedReferrerHost(hostname: string): boolean {
  const allowed = parseAllowedHosts(import.meta.env.VITE_EMBED_ALLOWED_HOSTS);
  return allowed.some((pattern) => hostMatches(hostname, pattern));
}

/** Проверка: приложение открыто во iframe с разрешённого сайта */
export function checkEmbedAccess(): EmbedAccess {
  if (!isEmbedGuardEnabled()) {
    return { allowed: true };
  }

  if (window.self === window.top) {
    return { allowed: false, reason: "direct" };
  }

  const referrer = document.referrer;
  if (!referrer) {
    // В iframe без Referer (политика браузера) — пропускаем, прямой доступ уже отсечён
    return { allowed: true };
  }

  try {
    const host = new URL(referrer).hostname;
    if (isAllowedReferrerHost(host)) {
      return { allowed: true };
    }
    return { allowed: false, reason: "forbidden-host", referrerHost: host };
  } catch {
    return { allowed: false, reason: "forbidden-host" };
  }
}

export function embedSiteUrl(): string {
  return import.meta.env.VITE_EMBED_SITE_URL?.trim() || "";
}

export function embedSiteName(): string {
  return import.meta.env.VITE_EMBED_SITE_NAME?.trim() || "ИНТЕХ-АТОМ";
}
