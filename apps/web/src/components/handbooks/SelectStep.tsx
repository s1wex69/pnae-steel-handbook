import { ChevronDown, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StepStatus = "empty" | "active" | "done" | "locked";

interface SelectStepProps {
  step: number;
  title: string;
  hint?: string;
  icon: LucideIcon;
  status: StepStatus;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function SelectStep({
  step,
  title,
  hint,
  icon: Icon,
  status,
  children,
  className,
  fullWidth,
}: SelectStepProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 p-4 transition-all duration-200",
        fullWidth && "sm:col-span-2",
        status === "empty" && "border-dashed border-[var(--color-border)] bg-[var(--color-background)]/50",
        status === "active" &&
          "border-[var(--color-primary)] bg-[var(--color-primary)]/8 shadow-[0_0_0_1px_var(--color-primary)]",
        status === "done" &&
          "border-[var(--color-primary)]/40 bg-[var(--color-success-muted)]",
        status === "locked" &&
          "border-[var(--color-border)] bg-[var(--color-muted)]/40 opacity-70",
        className
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
            status === "done" && "bg-[var(--color-success-muted)] text-[var(--color-primary)]",
            status === "active" && "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
            status === "empty" && "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
            status === "locked" && "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
          )}
        >
          {status === "done" ? <Check className="h-5 w-5" /> : step}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                status === "active" && "text-[var(--color-primary)]",
                status === "done" && "text-[var(--color-primary)]",
                (status === "empty" || status === "locked") &&
                  "text-[var(--color-muted-foreground)]"
              )}
            />
            <span className="font-semibold leading-tight">{title}</span>
            {status === "locked" && (
              <Lock className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" aria-hidden />
            )}
          </div>
          {hint && (
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

interface StyledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasValue?: boolean;
  placeholder?: string;
}

export function StyledSelect({
  className,
  hasValue,
  placeholder,
  children,
  disabled,
  ...props
}: StyledSelectProps) {
  return (
    <div className="relative">
      <select
        disabled={disabled}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border-2 bg-[var(--color-card)] px-3 pr-10 text-sm font-medium transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40",
          disabled && "cursor-not-allowed opacity-60",
          hasValue
            ? "border-[var(--color-border)] text-[var(--color-foreground)]"
            : "border-[var(--color-border)] text-[var(--color-muted-foreground)]",
          !disabled && !hasValue && "border-dashed",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted-foreground)]"
        aria-hidden
      />
    </div>
  );
}
