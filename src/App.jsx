import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Sidebar from "./Sidebar";
import BarcodeScanner from "./BarcodeScanner";
import ProductManagement from "./ProductManagement";
import { Toaster } from "@/components/ui/toaster";
import { Home, PackageSearch, ScanBarcode, LogOut } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");

  const tabs = [
    { name: "Dashboard", view: "dashboard", icon: Home },
    { name: "Scan Products", view: "barcodeScanner", icon: ScanBarcode },
    { name: "Inventory", view: "productManagement", icon: PackageSearch },
    { name: "Logout", view: "logout", icon: LogOut },
  ];

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
        localStorage.removeItem("sb-basihmnebvsflzkaivds-auth-token");
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
            className="absolute inset-0 w-full h-full z-10 bg-cover bg-center bg-gray-900 bg-blend-soft-light"
          ></div>
          {/* <div className="relative z-20">
            {currentView === "dashboard" ? (
              <Dashboard
                setCurrentView={setCurrentView}
                setIsAuthenticated={setIsAuthenticated}
              />
            ) : currentView == "barcodeScanner" ? (
              <BarcodeScanner />
            ) : (
              <ProductManagement
                setCurrentView={setCurrentView}
                setIsAuthenticated={setIsAuthenticated}
              />
            )}
          </div> */}

          <div className="relative z-20">
            {/* Tab buttons */}
            <TooltipProvider>
              <div className="flex space-x-4 border-b border-gray-300 mb-2 justify-center">
                {tabs.map((tab) => (
                  <Tooltip>
                    <button
                      key={tab.view}
                      onClick={() => {
                        if (tab.view == "logout") {
                          if (confirm("sure?")) {
                            localStorage.removeItem(
                              "sb-basihmnebvsflzkaivds-auth-token"
                            );
                            setIsAuthenticated(false);
                          }
                          return;
                        }
                        setCurrentView(tab.view);
                      }}
                      className={`px-4 py-2 flex items-center ${
                        currentView === tab.view
                          ? "border-b-2 border-sky-500 text-sky-500 font-semibold"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <TooltipTrigger>
                        <tab.icon size={25} />
                        {/* {tab.name} */}
                      </TooltipTrigger>
                      <TooltipContent className="bg-yellow-500 text-black font-semibold">
                        {tab.name}
                      </TooltipContent>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>

            {/* Render the appropriate component based on the current view */}
            <div className=" overflow-scroll">
              {currentView === "dashboard" && (
                <Dashboard
                  setCurrentView={setCurrentView}
                  setIsAuthenticated={setIsAuthenticated}
                />
              )}
              {currentView === "barcodeScanner" && <BarcodeScanner />}
              {currentView === "productManagement" && (
                <ProductManagement
                  setCurrentView={setCurrentView}
                  setIsAuthenticated={setIsAuthenticated}
                />
              )}
            </div>
          </div>

          {/* <Sidebar
            setIsAuthenticated={setIsAuthenticated}
            setCurrentView={setCurrentView}
          /> */}

          <Toaster />
        </div>
      )}
    </div>
  );
};

export default App;
