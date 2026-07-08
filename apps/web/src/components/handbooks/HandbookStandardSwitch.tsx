import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HandbookStandard = "pnae" | "gost34233-1";

const STANDARDS: { id: HandbookStandard; label: string; href: string }[] = [
  { id: "pnae", label: "ПНАЭ Г-7-002-86", href: "https://intech-atom.ru/pnae" },
  { id: "gost34233-1", label: "ГОСТ 34233.1", href: "https://intech-atom.ru/gost34233-1" },
];

interface Props {
  active: HandbookStandard;
  className?: string;
}

export function HandbookStandardSwitch({ active, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {STANDARDS.map((item) => (
        <Button
          key={item.id}
          asChild
          variant={item.id === active ? "default" : "outline"}
          size="sm"
        >
          <a href={item.href} target="_top" rel="noreferrer">
            {item.label}
          </a>
        </Button>
      ))}
    </div>
  );
}
