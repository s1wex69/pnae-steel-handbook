import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label="Сменить тему"
      title="Сменить тему"
      className={cn(
        "shrink-0 border-[var(--color-border)] bg-[var(--color-muted)]/45 text-[var(--color-heading)] shadow-sm",
        "hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-muted)]",
        className
      )}
    >
      {theme === "dark" ? <Sun className="h-[1.125rem] w-[1.125rem]" /> : <Moon className="h-[1.125rem] w-[1.125rem]" />}
    </Button>
  );
}
