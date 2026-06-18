import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const CALC_ROW_GRID = "sm:grid-cols-[minmax(0,1fr)_19rem]";
export const CALC_VALUE_GRID =
  "grid w-full max-w-[19rem] grid-cols-[4rem_11rem_2.75rem] items-center justify-self-end gap-x-2.5";

export const calcInputClass =
  "calc-input box-border h-11 w-full min-w-0 max-w-[11rem] text-right text-lg tabular-nums focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-0";

export const CALC_SECTION_CARD =
  "rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)] sm:p-8";

export function CalculatorPageShell({ children }: { children: ReactNode }) {
  return <div className="pnae-section-gap min-w-0 max-w-full">{children}</div>;
}

export function CalculatorPageHeader({
  eyebrow,
  title,
  standard,
  description,
}: {
  eyebrow?: string;
  title: string;
  standard?: string;
  description?: string;
}) {
  return (
    <section>
      <div
        className={cn(
          CALC_SECTION_CARD,
          "space-y-2"
        )}
      >
        {eyebrow ? (
          <p className="text-base font-medium text-[var(--color-muted-foreground)]">{eyebrow}</p>
        ) : null}
        <h1 className="font-heading text-2xl font-bold leading-snug text-[var(--color-heading)] sm:text-3xl">
          {title}
          {standard ? <> {standard}</> : null}
        </h1>
        {description ? (
          <p className="text-base leading-snug text-[var(--color-muted-foreground)]">{description}</p>
        ) : null}
      </div>
    </section>
  );
}

export function CalcSectionHeading({
  title,
  action,
  accent = true,
}: {
  title: string;
  action?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-wrap items-center justify-between gap-3",
        accent && "border-l-4 border-[var(--color-primary)] pl-4"
      )}
    >
      <h2 className="text-xl font-bold text-[var(--color-heading)] sm:text-2xl">{title}</h2>
      {action}
    </div>
  );
}

export function CalcSection({
  title,
  children,
  details,
  collapsible = false,
  expanded = false,
  onToggle,
  titleAccent = true,
  className,
}: {
  title: string;
  children: ReactNode;
  details?: ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  titleAccent?: boolean;
  className?: string;
}) {
  const toggleButton =
    collapsible && onToggle ? (
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-2 text-base font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-heading)]"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-5 w-5" />
            Скрыть
          </>
        ) : (
          <>
            <ChevronDown className="h-5 w-5" />
            Раскрыть
          </>
        )}
      </button>
    ) : null;

  return (
    <section className={cn(CALC_SECTION_CARD, className)}>
      <CalcSectionHeading title={title} action={toggleButton} accent={titleAccent} />
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_19rem] sm:gap-x-6">
        {collapsible && expanded && details ? (
          <>
            <div className="contents">{details}</div>
            <div className="col-span-2 my-2 border-b border-[var(--color-border)]/50" aria-hidden />
          </>
        ) : null}
        <div className="contents">{children}</div>
      </div>
    </section>
  );
}

export function CalculatorDiagramCard({ children }: { children: ReactNode }) {
  return (
    <section>
      <div
        className={cn(
          CALC_SECTION_CARD,
          "flex min-h-[220px] items-center justify-center lg:min-h-[280px]"
        )}
      >
        {children}
      </div>
    </section>
  );
}
