import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AppNav } from "./AppNav";
import { PageLoader } from "@/components/common/PageLoader";

export function AppLayout({ onSignOut }) {
  return (
    <div className="relative flex h-screen w-full flex-col">
      <div className="absolute inset-0 z-10 h-full w-full bg-gray-900 bg-cover bg-center bg-blend-soft-light" />

      <div className="relative z-20 flex h-full flex-col">
        <main className="flex-grow overflow-auto md:mt-10">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <AppNav onSignOut={onSignOut} />
      </div>
    </div>
  );
}
