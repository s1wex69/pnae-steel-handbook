import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { PnaeNav } from "./PnaeNav";

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-4 lg:p-6">
        <PnaeNav />
        <div className="mt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
