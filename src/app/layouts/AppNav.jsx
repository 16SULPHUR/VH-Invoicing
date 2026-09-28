import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ICON_STROKE, MORE_NAV_ITEMS, NAV_ITEMS, PRIMARY_NAV_ITEMS } from "@/config/navigation";
import { SyncStatusBar } from "@/components/common/SyncStatusBar";
import { BUSINESS } from "@/config/business";

const sideLink = ({ isActive }) =>
  `press flex items-center gap-3 rounded-full px-3.5 py-2.5 text-[14px] font-semibold transition-colors ${
    isActive ? "bg-rani text-rani-foreground" : "text-indigo-foreground hover:bg-white/10 hover:text-white"
  }`;

function Wordmark({ className = "" }) {
  const [first, ...rest] = BUSINESS.displayName.split(" ");
  return (
    <div className={`font-display text-[23px] font-extrabold leading-[0.95] tracking-tight text-white ${className}`}>
      {first}
      {rest.length > 0 && <span className="block text-marigold">{rest.join(" ")}</span>}
    </div>
  );
}

/** Desktop: the indigo sidebar with its block-print border. */
export function AppRail({ onSignOut }) {
  return (
    <nav
      aria-label="Main"
      className="relative hidden w-[13.25rem] shrink-0 flex-col gap-1 bg-indigo py-5 pl-[1.6rem] pr-3.5 md:flex"
    >
      <div className="motif-strip absolute inset-y-0 left-0 w-3" aria-hidden />
      <Wordmark className="mb-6 ml-2.5" />

      {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={sideLink}>
          <Icon size={18} strokeWidth={ICON_STROKE} aria-hidden />
          {label}
        </NavLink>
      ))}

      <div className="mt-auto flex flex-col gap-1">
        <SyncStatusBar variant="sidebar" />
        <button
          type="button"
          onClick={onSignOut}
          className="press flex items-center gap-3 rounded-full px-3.5 py-2.5 text-[14px] font-semibold text-indigo-foreground transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} strokeWidth={ICON_STROKE} aria-hidden />
          Log out
        </button>
      </div>
    </nav>
  );
}

const tabClass = (isActive) =>
  `press flex min-w-0 flex-1 flex-col items-center gap-1 pb-1 pt-1.5 text-[11px] font-bold transition-colors ${
    isActive ? "text-rani" : "text-muted-foreground"
  }`;

function TabIcon({ icon: Icon, active }) {
  return (
    <span
      className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
        active ? "bg-rani text-rani-foreground" : ""
      }`}
    >
      <Icon size={19} strokeWidth={ICON_STROKE} aria-hidden />
    </span>
  );
}

/** Mobile: bottom tab bar, with Cashbook, Reports and sign-out under More. */
export function AppTabBar({ onSignOut }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = MORE_NAV_ITEMS.some((item) => pathname.startsWith(item.to));

  return (
    <>
      <nav
        aria-label="Main"
        className="flex shrink-0 items-stretch border-t-[1.5px] border-border bg-surface px-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 md:hidden"
      >
        {PRIMARY_NAV_ITEMS.map(({ short, to, icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => tabClass(isActive)}>
            {({ isActive }) => (
              <>
                <TabIcon icon={icon} active={isActive} />
                <span className="truncate">{short}</span>
              </>
            )}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMoreOpen(true)} className={tabClass(moreActive)}>
          <TabIcon icon={Menu} active={moreActive} />
          <span>More</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1rem)]">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-xl font-extrabold">More</SheetTitle>
          </SheetHeader>
          <div className="mt-3 grid gap-1">
            {MORE_NAV_ITEMS.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `press flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold ${
                    isActive ? "bg-accent text-accent-foreground" : "hover:bg-secondary"
                  }`
                }
              >
                <Icon size={19} strokeWidth={ICON_STROKE} aria-hidden />
                {label}
              </NavLink>
            ))}
            <div className="my-1 flex items-center justify-between rounded-2xl px-4 py-2 text-sm text-muted-foreground">
              Sync status
              <SyncStatusBar />
            </div>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onSignOut();
              }}
              className="press flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold text-destructive hover:bg-destructive/10"
            >
              <LogOut size={19} strokeWidth={ICON_STROKE} aria-hidden />
              Log out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
