import { Suspense, lazy, useEffect, useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./AppProviders";
import { ErrorBoundary } from "./ErrorBoundary";
import { createRouter } from "./router";
import LoginPage from "@/features/auth/LoginPage";
import { PageLoader } from "@/components/common/PageLoader";
import { useAuth } from "@/hooks/useAuth";
import { syncManager } from "@/lib/offline/syncManager";
import { cacheManager } from "@/lib/offline/cacheManager";
import { isOnline } from "@/lib/offline/network";
import { queryClient, queryKeys } from "@/lib/queryClient";

// Customers open pay and bill links from WhatsApp without an account.
const PayPage = lazy(() => import("@/features/whatsapp/pay/PayPage"));
const BillPage = lazy(() => import("@/features/bill/BillPage"));

function publicPage() {
  const { pathname } = window.location;
  if (pathname.startsWith("/pay/")) return PayPage;
  if (pathname.startsWith("/b/")) return BillPage;
  return null;
}

function AuthenticatedApp({ onSignOut }) {
  const router = useMemo(() => createRouter({ onSignOut }), [onSignOut]);
  return <RouterProvider router={router} />;
}

export default function App() {
  const PublicPage = publicPage();
  if (PublicPage) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <PublicPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  return <ShopApp />;
}

function ShopApp() {
  const { isAuthenticated, isLoading, setIsAuthenticated, signOut } = useAuth();

  useEffect(() => {
    const teardown = syncManager.setupConnectivityListeners();
    if (isOnline()) cacheManager.refreshAll();
    const unsubscribe = syncManager.subscribe((event) => {
      if (event.type === "sync_completed") {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      }
    });
    return () => {
      unsubscribe();
      teardown();
    };
  }, []);

  const handleSignOut = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    await signOut();
  };

  return (
    <ErrorBoundary>
      <AppProviders>
        {isLoading ? (
          <PageLoader label="Loading authentication…" />
        ) : isAuthenticated ? (
          <AuthenticatedApp onSignOut={handleSignOut} />
        ) : (
          <LoginPage onAuthenticated={() => setIsAuthenticated(true)} />
        )}
      </AppProviders>
    </ErrorBoundary>
  );
}
