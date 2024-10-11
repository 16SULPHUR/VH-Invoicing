import React, { useState } from "react";
import { Home, Sticker , LogOut, EllipsisVertical } from "lucide-react";

const Sidebar = ({ setIsAuthenticated, setCurrentView }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false); // State to track hover on EllipsisVertical

  const menuItems = [
    { 
      name: "Dashboard", 
      icon: Home,
      onClick: () => setCurrentView("dashboard") // Set view to Dashboard
    },
    { 
      name: "Sticker Printer", 
      icon: Sticker,
      onClick: () => setCurrentView("productSticker") // Set view to ProductSticker
    },
    {
      name: "Logout",
      icon: LogOut,
      onClick: () => {
        localStorage.removeItem("sb-basihmnebvsflzkaivds-auth-token");
        setIsAuthenticated(false);
      }, // Set isAuthenticated to false on logout click
    },
  ];

  return (
    <div
      className={`fixed top-4 right-4 h-fit text-sky-300 z-50`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full justify-between">
        <div className="flex flex-col">
          {/* Conditionally show either the EllipsisVertical or the menu items */}
          {!isMenuHovered ? (
            // Show EllipsisVertical icon when not hovered
            <div
              className="flex items-center px-3 py-3 hover:bg-black cursor-pointer rounded-full bg-black"
              onMouseEnter={() => setIsMenuHovered(true)}
            >
              <EllipsisVertical size={24} />
            </div>
          ) : (
            // Show menu items when hovered
            <div onMouseLeave={() => setIsMenuHovered(false)}>
              {menuItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center px-4 py-3 bg-black hover:bg-blue-950 cursor-pointer"
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
