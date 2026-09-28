import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AppRail, AppTabBar } from "./AppNav";
import { PageLoader } from "@/components/common/PageLoader";

export function AppLayout({ onSignOut }) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <AppRail onSignOut={onSignOut} />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <AppTabBar onSignOut={onSignOut} />
      </div>
    </div>
  );
}
