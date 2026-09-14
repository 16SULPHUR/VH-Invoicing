import { useEffect, useMemo } from "react";
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

function AuthenticatedApp({ onSignOut }) {
  const router = useMemo(() => createRouter({ onSignOut }), [onSignOut]);
  return <RouterProvider router={router} />;
}

export default function App() {
  const { isAuthenticated, isLoading, setIsAuthenticated, signOut } = useAuth();

  useEffect(() => {
    const teardown = syncManager.setupConnectivityListeners();
    if (isOnline()) cacheManager.refreshAll();
    return teardown;
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
