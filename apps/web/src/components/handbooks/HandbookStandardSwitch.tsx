import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HandbookStandard = "pnae" | "gost34233-1";

const HANDBOOK_SWITCH_MESSAGE = "pnae-handbook-switch";

const STANDARDS: {
  id: HandbookStandard;
  label: string;
  devPath: string;
  prodHref: string;
  prodIframeSrc: string;
}[] = [
  {
    id: "pnae",
    label: "ПНАЭ Г-7-002-86",
    devPath: "/",
    prodHref: "https://intech-atom.ru/pnae",
    prodIframeSrc: "https://s1wex69.github.io/pnae-steel-handbook/pnae/",
  },
  {
    id: "gost34233-1",
    label: "ГОСТ 34233.1",
    devPath: "/handbooks/gost34233-1",
    prodHref: "https://intech-atom.ru/gost",
    prodIframeSrc: "https://s1wex69.github.io/pnae-steel-handbook/gost34233-1/",
  },
];

function switchHandbookInEmbed(iframeSrc: string) {
  window.parent.postMessage({ type: HANDBOOK_SWITCH_MESSAGE, src: iframeSrc }, "*");
}

function onProdHandbookClick(event: MouseEvent<HTMLAnchorElement>, iframeSrc: string) {
  if (window.self === window.top) return;
  event.preventDefault();
  switchHandbookInEmbed(iframeSrc);
}

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
            <a
              href={item.prodHref}
              target="_top"
              rel="noreferrer"
              onClick={(event) => onProdHandbookClick(event, item.prodIframeSrc)}
            >
              {item.label}
            </a>
          )}
        </Button>
      ))}
    </div>
  );
}
