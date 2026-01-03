import React, { useState } from "react";
import { Home, PackageSearch , LogOut, Menu, ScanBarcode  } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Sidebar = ({ setIsAuthenticated, setCurrentView }) => {
  const menuItems = [
    {
      name: "Dashboard",
      icon: Home,
      onClick: () => setCurrentView("dashboard"),
    },
    {
      name: "Scan Products",
      icon: ScanBarcode ,
      onClick: () => {
        setCurrentView("barcodeScanner")
      },
    },
    {
      name: "Inventory",
      icon: PackageSearch,
      onClick: () => setCurrentView("productManagement"),
    },
    {
      name: "Logout",
      icon: LogOut,
      onClick: () => {
        localStorage.removeItem("sb-basihmnebvsflzkaivds-auth-token");
        setIsAuthenticated(false);
      },
    },
  ];

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="bg-gray-900 text-pink-400 hover:bg-gray-800 hover:text-pink-300">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
          {menuItems.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className="flex items-center px-2 py-2 text-pink-400 hover:bg-gray-800 hover:text-pink-300 cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Sidebar;