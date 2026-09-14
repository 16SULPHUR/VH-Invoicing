import { useCallback, useEffect, useState } from "react";
import { authService } from "@/services/authService";

const LOADING_FALLBACK_MS = 3000;

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const validateSession = useCallback(async () => {
    const valid = await authService.hasValidSession();
    setIsAuthenticated(valid);
    setIsLoading(false);
    return valid;
  }, []);

  useEffect(() => {
    validateSession();

    const unsubscribe = authService.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setIsAuthenticated(true);
      if (event === "SIGNED_OUT") setIsAuthenticated(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setIsLoading(false);
    });

    // Never leave the user staring at a spinner if Supabase never answers.
    const timeout = setTimeout(() => setIsLoading(false), LOADING_FALLBACK_MS);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [validateSession]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isLoading, setIsAuthenticated, signOut, validateSession };
}
