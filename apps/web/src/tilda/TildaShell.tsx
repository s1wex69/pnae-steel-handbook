import { useEffect, type ReactNode } from "react";
import { EmbedGuard } from "@/components/EmbedGuard";
import { fixTildaEmbedHost } from "@/tilda/fixTildaEmbedHost";
import { useDocumentWheelScroll } from "@/hooks/useDocumentWheelScroll";

export function TildaShell({ children }: { children: ReactNode }) {
  useDocumentWheelScroll();

  useEffect(() => {
    fixTildaEmbedHost();
  }, []);

  return (
    <EmbedGuard>
      <div className="pnae-tilda-embed w-full min-w-0 max-w-full overflow-x-clip bg-[var(--color-card)] text-[var(--color-foreground)]">
        <div className="mx-auto box-border w-full min-w-0 max-w-[1400px] px-4 py-8 sm:px-6">{children}</div>
      </div>
    </EmbedGuard>
  );
}