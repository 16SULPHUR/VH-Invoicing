import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PRIMARY_NAV_ITEMS } from "@/config/navigation";

function NavButton({ label, children, ...props }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="bg-yellow-500 font-semibold text-black" {...props}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

const linkClass = ({ isActive }) =>
  `flex cursor-pointer items-center px-4 py-2 transition-colors ${
    isActive
      ? "border-b-2 border-pink-500 font-semibold text-pink-500"
      : "text-gray-400 hover:text-gray-300"
  }`;

export function AppNav({ onSignOut }) {
  return (
    <div className="fixed bottom-0 h-fit w-full border-t border-gray-400 bg-black md:fixed md:top-0 md:border-b">
      <nav className="mx-auto max-w-screen-xl">
        <div className="flex justify-center space-x-4">
          {PRIMARY_NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <NavButton key={to} label={label}>
              <NavLink to={to} end={end} className={linkClass} aria-label={label}>
                <Icon size={20} />
              </NavLink>
            </NavButton>
          ))}

          <NavButton label="Logout">
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Logout"
              className="flex cursor-pointer items-center px-4 py-2 text-gray-400 transition-colors hover:text-gray-300"
            >
              <LogOut size={20} />
            </button>
          </NavButton>
        </div>
      </nav>
    </div>
  );
}
