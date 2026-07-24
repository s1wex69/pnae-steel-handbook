import { useEffect, type ReactNode } from "react";
import { EmbedGuard } from "@/components/EmbedGuard";
import { fixTildaEmbedHost } from "@/tilda/fixTildaEmbedHost";
import {
  useDocumentWheelScroll,
  useEmbedHeightReporter,
} from "@/hooks/useDocumentWheelScroll";

export function TildaShell({ children }: { children: ReactNode }) {
  useDocumentWheelScroll();
  useEmbedHeightReporter();

  useEffect(() => {
    fixTildaEmbedHost();
  }, []);

  return (
    <EmbedGuard>
      <div className="pnae-tilda-embed w-full min-w-0 max-w-full overflow-x-clip bg-[var(--color-card)] text-[var(--color-foreground)]">
        {/* pt-24 / sm:pt-28 — запас под sticky-шапку Tilda, чтобы заголовок не перекрывался */}
        <div className="mx-auto box-border w-full min-w-0 max-w-[1400px] px-4 pb-8 pt-24 sm:px-6 sm:pt-28">
          {children}
        </div>
      </div>
    </EmbedGuard>
  );
}