import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HandbookStandard = "pnae" | "gost34233-1";

const STANDARDS: {
  id: HandbookStandard;
  label: string;
  devPath: string;
  prodHref: string;
}[] = [
  {
    id: "pnae",
    label: "ПНАЭ Г-7-002-86",
    devPath: "/",
    prodHref: "https://intech-atom.ru/pnae",
  },
  {
    id: "gost34233-1",
    label: "ГОСТ 34233.1",
    devPath: "/handbooks/gost34233-1",
    prodHref: "https://intech-atom.ru/gost34233-1",
  },
];

interface Props {
  active: HandbookStandard;
  className?: string;
}

export function HandbookStandardSwitch({ active, className }: Props) {
  const useInternalRoutes = import.meta.env.DEV;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {STANDARDS.map((item) => (
        <Button
          key={item.id}
          asChild
          variant={item.id === active ? "default" : "outline"}
          size="sm"
        >
          {useInternalRoutes ? (
            <Link to={item.devPath}>{item.label}</Link>
          ) : (
            <a href={item.prodHref} target="_top" rel="noreferrer">
              {item.label}
            </a>
          )}
        </Button>
      ))}
    </div>
  );
}
