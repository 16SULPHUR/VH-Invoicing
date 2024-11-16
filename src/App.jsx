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
  const [currentView, setCurrentView] = useState(() => {
    // Set initial view based on screen width - runs once during initialization
    return window.innerWidth < 768 ? "barcodeScanner" : "dashboard";
  });
  const [isMobile, setIsMobile] = useState(false);

  const tabs = [
    { name: "Dashboard", view: "dashboard", icon: Home },
    { name: "Scan Products", view: "barcodeScanner", icon: ScanBarcode },
    { name: "Inventory", view: "productManagement", icon: PackageSearch },
    { name: "Logout", view: "logout", icon: LogOut },
  ];


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
  useEffect(() => {

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setIsAuthenticated(true);
        } else if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
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
    }, 60000);

    return () => clearInterval(checkSessionExpiration);
  }, []);

  if (isLoading) {
    checkSession()
    return <div>Loading...</div>;
  }

  const handleTabClick = (tabView) => {
    if (tabView === "logout") {
      if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("sb-basihmnebvsflzkaivds-auth-token");
        setIsAuthenticated(false);
      }
      return;
    }
    setCurrentView(tabView);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <Login setIsAuthenticated={setIsAuthenticated} />
      ) : (
        <div className="relative w-full h-screen flex flex-col">
          <div
            id="bg"
            className="absolute inset-0 w-full h-full z-10 bg-cover bg-center bg-gray-900 bg-blend-soft-light"
          ></div>

          <div className="relative z-20 flex flex-col h-full">
            {/* Main content area */}
            <div className="flex-grow overflow-auto md:mt-10">
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

            {/* Navigation tabs */}
            <TooltipProvider>
              <div className="md:fixed md:top-0 fixed bottom-0 w-full bg-black h-fit border-t md:border-b border-gray-400">
                <nav className="max-w-screen-xl mx-auto">
                  <div className="flex justify-center space-x-4">
                    {tabs.map((tab) => (
                      <Tooltip key={tab.view}>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => handleTabClick(tab.view)}
                            className={`px-4 py-2 flex items-center cursor-pointer transition-colors ${
                              currentView === tab.view
                                ? "border-b-2 md:border-b-2 border-sky-500 text-sky-500 font-semibold"
                                : "text-gray-400 hover:text-gray-300"
                            }`}
                          >
                            <tab.icon size={25} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-yellow-500 text-black font-semibold">
                          {tab.name}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </nav>
              </div>
            </TooltipProvider>
          </div>

          <Toaster />
        </div>
      )}
    </div>
  );

};

export default App;
