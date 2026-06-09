import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 overflow-auto p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
