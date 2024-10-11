import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Dashboard from "./Dashboard";
import Login from "./Login";
import ProductSticker from "./ProductSticker";
import Sidebar from "./Sidebar";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setIsAuthenticated(true);
        } else if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          // Check if the session is still valid after a token refresh
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
          setIsAuthenticated(!!currentSession);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkSessionExpiration = setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkSessionExpiration);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {!isAuthenticated ? (
        <Login setIsAuthenticated={setIsAuthenticated} />
      ) : (
        <div className="relative w-full h-full">
          <div
            id="bg"
            className="absolute inset-0 w-full h-full z-10 bg-cover bg-center bg-zinc-800 bg-blend-soft-light"
            style={{
              backgroundImage:
                'url("https://bill.varietyheaven.in/vh-white.png")',
            }}
          ></div>
          <div className="relative z-20">
            {/* Render the appropriate component based on the current view */}
            {currentView === "dashboard" ? (
              <Dashboard
                setCurrentView={setCurrentView}
                setIsAuthenticated={setIsAuthenticated}
              />
            ) : (
              <ProductSticker
                setCurrentView={setCurrentView}
                setIsAuthenticated={setIsAuthenticated}
              />
            )}
          </div>

          <Sidebar
            setIsAuthenticated={setIsAuthenticated}
            setCurrentView={setCurrentView}
          />
        </div>
      )}
    </div>
  );
};

export default App;
