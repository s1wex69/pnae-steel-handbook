import type { ReactNode } from "react";

export const HANDBOOK_SECTION_HEADING =
  "pnae-handbook-section-title font-bold leading-snug text-[var(--color-heading)]";

export function HandbookSectionHeading({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <h2 id={id} className={HANDBOOK_SECTION_HEADING}>
      {children}
    </h2>
  );
}
