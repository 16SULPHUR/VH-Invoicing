import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ICON_STROKE, NAV_ITEMS, PRIMARY_NAV_ITEMS } from "@/config/navigation";
import { SyncStatusBar } from "@/components/common/SyncStatusBar";

const railLink = ({ isActive }) =>
  `press relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
    isActive
      ? "bg-primary/15 text-primary after:absolute after:-left-2 after:h-6 after:w-1 after:rounded-r-full after:bg-primary"
      : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
  }`;

const tabLink = ({ isActive }) =>
  `press flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
    isActive ? "text-primary" : "text-muted-foreground"
  }`;

/** Desktop: a persistent icon rail. Wide enough to hit, narrow enough to ignore. */
export function AppRail({ onSignOut }) {
  return (
    <nav
      aria-label="Main"
      className="hidden w-16 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface py-3 md:flex"
    >
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        VH
      </div>

      {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
        <Tooltip key={to}>
          <TooltipTrigger asChild>
            <NavLink to={to} end={end} className={railLink} aria-label={label}>
              <Icon size={20} strokeWidth={ICON_STROKE} aria-hidden />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="mt-auto flex flex-col items-center gap-1">
        <SyncStatusBar />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Log out"
              className="press flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            >
              <LogOut size={20} strokeWidth={ICON_STROKE} aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Log out</TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}

/** Mobile: a bottom tab bar, thumb-reachable, with labels since there is room. */
export function AppTabBar({ onSignOut }) {
  return (
    <nav
      aria-label="Main"
      className="flex shrink-0 items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {PRIMARY_NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={tabLink}>
          <Icon size={20} strokeWidth={ICON_STROKE} aria-hidden />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onSignOut}
        className="press flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
      >
        <LogOut size={20} strokeWidth={ICON_STROKE} aria-hidden />
        <span>Log out</span>
      </button>
    </nav>
  );
}
