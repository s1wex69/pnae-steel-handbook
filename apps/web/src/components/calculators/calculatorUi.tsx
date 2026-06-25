import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Var } from "@/components/handbooks/MathNotation";
import { cn } from "@/lib/utils";

export const CALC_ROW_GRID = "sm:grid-cols-[minmax(0,1fr)_minmax(10.5rem,14rem)]";
export const CALC_ROW_GRID_IN_COLUMN =
  "grid-cols-1 gap-y-2 xl:grid-cols-[minmax(0,1fr)_minmax(10.5rem,14rem)] xl:items-start xl:gap-y-0";

export const CALC_VALUE_GRID =
  "grid w-full min-w-0 max-w-[14rem] grid-cols-[minmax(2.25rem,auto)_minmax(5.5rem,1fr)_minmax(2rem,auto)] items-center justify-self-end gap-x-1.5";

export const CALC_VALUE_GRID_WIDE =
  "grid w-full min-w-0 max-w-[min(100%,22rem)] grid-cols-[minmax(2.25rem,auto)_minmax(8rem,1fr)_minmax(2rem,auto)] items-center justify-self-end gap-x-1.5";

export const CALC_VALUE_GRID_NO_SYMBOL =
  "grid w-full min-w-0 max-w-[min(100%,22rem)] grid-cols-[minmax(0,1fr)_minmax(2rem,auto)] items-center justify-self-end gap-x-1.5 sm:col-start-2";

export const CALC_SYMBOL_CLASS =
  "min-w-0 shrink-0 justify-self-end text-right text-xl font-semibold text-[var(--color-heading)]";

export const calcInputClass =
  "calc-input box-border h-9 w-full min-w-0 text-right text-base tabular-nums focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-0";

export const calcResultBoxClass =
  "flex h-9 w-full min-w-0 items-center justify-end overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 text-base tabular-nums whitespace-nowrap text-[var(--color-foreground)]";

export const CALC_SECTION_CARD =
  "rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)] sm:p-8";

export const CALC_SECTION_TITLE =
  "text-xl font-bold leading-snug text-[var(--color-heading)] sm:text-2xl";

export const CALC_PAGE_TITLE = CALC_SECTION_TITLE;

/** s_p — расчётная толщина в результатах */
export const CALC_RESULT_SP_SYMBOL = <Var letter="s" sub="p" className="!text-2xl" />;

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
  title: ReactNode;
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
        <h1 className={CALC_PAGE_TITLE}>
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
  accent = false,
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
      <h2 className={CALC_SECTION_TITLE}>{title}</h2>
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
  titleAccent = false,
  className,
  twoColumns = false,
}: {
  title: string;
  children: ReactNode;
  details?: ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  titleAccent?: boolean;
  className?: string;
  twoColumns?: boolean;
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
      {(!collapsible || expanded) &&
        (twoColumns ? (
          <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-0 xl:grid-cols-2 xl:items-start">
            {children}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-x-6">
            {collapsible && expanded && details ? (
              <>
                <div className="contents">{details}</div>
                <div className="col-span-2 my-2 border-b border-[var(--color-border)]/50" aria-hidden />
              </>
            ) : null}
            <div className="contents">{children}</div>
          </div>
        ))}
    </section>
  );
}

export function ApplicabilityStatus({ ok, inline = false }: { ok: boolean; inline?: boolean }) {
  const badge = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 font-semibold",
        inline ? "text-sm sm:text-base" : "text-base sm:text-lg",
        ok
          ? "bg-[var(--color-emphasis)]/12 text-[var(--color-emphasis)]"
          : "bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]"
      )}
    >
      {ok ? "Выполнено" : "Не выполнено"}
    </span>
  );

  if (inline) return badge;

  return <p className="mt-3 sm:mt-4">{badge}</p>;
}

export function CalcCheckRow({
  ok,
  children,
  placeholder,
}: {
  ok?: boolean;
  children?: ReactNode;
  placeholder?: string;
}) {
  if (placeholder != null && ok === undefined) {
    return <p className="col-span-full py-3 text-[var(--color-muted-foreground)]">{placeholder}</p>;
  }

  return (
    <div className="col-span-full flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="min-w-0 shrink text-lg font-semibold tabular-nums text-[var(--color-heading)] sm:text-xl">
        <span className="inline-flex max-w-full items-center gap-x-2 whitespace-nowrap">{children}</span>
      </span>
      {ok !== undefined ? (
        <span className="shrink-0 self-start sm:self-center">
          <ApplicabilityStatus ok={ok} inline />
        </span>
      ) : null}
    </div>
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
