import { useEffect, type ReactNode } from "react";
import { EmbedGuard } from "@/components/EmbedGuard";
import { fixTildaEmbedHost } from "@/tilda/fixTildaEmbedHost";

export function TildaShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    fixTildaEmbedHost();
  }, []);

  return (
    <EmbedGuard>
      <div className="pnae-tilda-embed w-full min-w-0 max-w-full overflow-x-clip bg-white text-[var(--color-foreground)]">
        <div className="mx-auto box-border w-full min-w-0 max-w-[1200px] px-4 py-8 sm:px-8">{children}</div>
      </div>
    </EmbedGuard>
  );
}