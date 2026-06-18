import { useEffect, useState, type ReactNode } from "react";
import {
  checkEmbedAccess,
  embedSiteName,
  embedSiteUrl,
  isEmbedGuardEnabled,
  type EmbedAccess,
} from "@/lib/embedGuard";

function EmbedStub({ access }: { access: Exclude<EmbedAccess, { allowed: true }> }) {
  const siteName = embedSiteName();
  const siteUrl = embedSiteUrl();

  const title =
    access.reason === "direct"
      ? "Раздел доступен только на сайте"
      : "Встраивание с этого адреса не разрешено";

  const description =
    access.reason === "direct" ? (
      <>
        Справочник и калькуляторы ПНАЭ открываются только со страницы{" "}
        {siteUrl ? (
          <a
            href={siteUrl}
            className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            {siteName}
          </a>
        ) : (
          siteName
        )}
        .
      </>
    ) : (
      <>
        Страница открыта во встроенном окне с недопустимого источника
        {access.referrerHost ? (
          <>
            {" "}
            (<span className="font-mono text-sm">{access.referrerHost}</span>)
          </>
        ) : null}
        . Откройте раздел через {siteName}.
      </>
    );

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          ПНАЭ Г-7-002-86
        </p>
        <h1 className="font-heading mt-2 text-2xl font-bold text-[var(--color-heading)]">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-foreground)]">
          {description}
        </p>
        {siteUrl ? (
          <a
            href={siteUrl}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 py-3 text-base font-semibold text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90"
          >
            Перейти на сайт
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function EmbedGuard({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<EmbedAccess | null>(() =>
    isEmbedGuardEnabled() ? null : { allowed: true }
  );

  useEffect(() => {
    if (!isEmbedGuardEnabled()) return;
    setAccess(checkEmbedAccess());
  }, []);

  if (!isEmbedGuardEnabled()) {
    return <>{children}</>;
  }

  if (access === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-[var(--color-muted-foreground)]">
        Проверка доступа…
      </div>
    );
  }

  if (!access.allowed) {
    return <EmbedStub access={access} />;
  }

  return <>{children}</>;
}
