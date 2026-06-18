import { Link } from "react-router-dom";
import logoUrl from "@/assets/logo.png";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-header)] bg-[var(--color-header)] text-[var(--color-header-foreground)] shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-6">
        <Link
          to="/"
          className="flex items-center gap-3"
          aria-label="ИНТЕХ-АТОМ — справочник свойств сталей ПНАЭ"
        >
          <img src={logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-md object-contain" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-wide sm:text-base">ИНТЕХ-АТОМ</span>
            <span className="text-xs font-normal opacity-75 sm:text-sm">ПНАЭ</span>
          </span>
        </Link>
      </div>
    </header>
  );
}