import React, { useState } from "react";
import { Home, Sticker, LogOut, Menu, Barcode } from "lucide-react";

const Sidebar = ({ setIsAuthenticated, setCurrentView }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false); // State to track hover on EllipsisVertical

  const menuItems = [
    {
      name: "Dashboard",
      icon: Home,
      onClick: () => setCurrentView("dashboard"), // Set view to Dashboard
    },
    {
      name: "Scan Products",
      icon: Barcode,
      onClick: () => {
        // localStorage.removeItem("sb-basihmnebvsflzkaivds-auth-token");
        // setIsAuthenticated(false);
      },
    },
    {
      name: "Sticker Printer",
      icon: Sticker,
      onClick: () => setCurrentView("productSticker"), // Set view to ProductSticker
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
    <div
      className={`fixed top-4 right-4 h-fit text-sky-300 z-50`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div
        className="flex flex-col h-full justify-between bg-zinc-950"
      >
        <div className="flex flex-col">
          {/* Conditionally show either the EllipsisVertical or the menu items */}
          {!isMenuHovered ? (
            // Show EllipsisVertical icon when not hovered
            <div
              className="flex items-center px-3 py-3 bg-zinc-950 cursor-pointer rounded-full hover:bg-zinc-900"
              onMouseEnter={() => setIsMenuHovered(true)}
            >
              <Menu size={24} />
            </div>
          ) : (
            // Show menu items when hovered
            <div
              className="rounded-lg overflow-hidden "
              onMouseLeave={() => setIsMenuHovered(false)}
            >
              {menuItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center px-4 py-3  backdrop-blur-sm hover:bg-zinc-900 cursor-pointer"
                  onClick={item.onClick} // Add onClick handler here
                >
                  <item.icon size={24} />
                  {isExpanded && <span className="ml-4">{item.name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
