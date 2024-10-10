import React, { useState } from 'react';
import { Home, BarChart2, LogOut } from 'lucide-react';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'Sales', icon: BarChart2 },
    { name: 'Logout', icon: LogOut },
  ];

  return (
    <div
      className={`h-screen bg-gray-800 text-white ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer"
          >
            <item.icon size={24} />
            {isExpanded && (
              <span className="ml-4">
                {item.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;