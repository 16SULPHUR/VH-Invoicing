import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Dashboard from "./Dashboard";
import Login from "./Login";
import BarcodeScanner from "./BarcodeScanner";
import ProductManagement from "./ProductManagement";
import { Toaster } from "@/components/ui/toaster";
import { Home, PackageSearch, ScanBarcode, LogOut, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MobileDashboard from "./MobileDashboard";
import CustomerManagement from "./CustomerManagement";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState(() => 
    window.innerWidth < 768 ? "barcodeScanner" : "dashboard"
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const tabs = [
    { name: "Dashboard", view: "dashboard", icon: Home },
    { name: "Scan Products", view: "barcodeScanner", icon: ScanBarcode },
    { name: "Inventory", view: "productManagement", icon: PackageSearch },
    { name: "Customers", view: "customerManagement", icon: Users },
    { name: "Logout", view: "logout", icon: LogOut },
  ];

  const validateSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      
      // Check if session is valid and not expired
      if (session && session.expires_at > Date.now() / 1000) {
        setIsAuthenticated(true);
        return true;
      }
      
      // If session is invalid or expired
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error("Session validation error:", error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  

  useEffect(() => {
    // Immediately validate session on app load
    validateSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        switch(event) {
          case "SIGNED_IN":
            setIsAuthenticated(true);
            setIsLoading(false);
            break;
          case "SIGNED_OUT":
            setIsAuthenticated(false);
            setIsLoading(false);
            break;
        }
      }
    );

    // Cleanup listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Periodic session validation
  // useEffect(() => {
  //   const sessionCheckInterval = setInterval(() => {
  //     validateSession();
  //   }, 60000); // Check every minute

  //   return () => clearInterval(sessionCheckInterval);
  // }, []);

  // Fallback loading state
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(loadingTimeout);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading authentication...
      </div>
    );
  }

  const handleTabClick = (tabView) => {
    if (tabView === "logout") {
      if (confirm("Are you sure you want to logout?")) {
        supabase.auth.signOut();
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
            <div className="flex-grow overflow-auto md:mt-10">
              {currentView === "dashboard" && (
                isMobile ? (
                  <MobileDashboard
                    setCurrentView={setCurrentView}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                ) : (
                  <Dashboard
                    setCurrentView={setCurrentView}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                )
              )}
              {currentView === "barcodeScanner" && <BarcodeScanner />}
              {currentView === "customerManagement" && <CustomerManagement />}
              {currentView === "productManagement" && (
                <ProductManagement
                  setCurrentView={setCurrentView}
                  setIsAuthenticated={setIsAuthenticated}
                />
              )}
            </div>

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