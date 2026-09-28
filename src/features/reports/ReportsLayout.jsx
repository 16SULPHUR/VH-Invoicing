import { Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { PageLoader } from "@/components/common/PageLoader";

const REPORT_TABS = [
  { to: "transactions", label: "Transactions" },
  { to: "ledger", label: "Ledger" },
  { to: "trial-balance", label: "Trial balance" },
  { to: "gst", label: "GST" },
];

const tabClass = ({ isActive }) =>
  `press rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
  }`;

export default function ReportsLayout() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav
        aria-label="Reports"
        className="shrink-0 border-b border-border bg-surface px-4 py-2 md:px-6"
      >
        <div className="mx-auto flex max-w-[1400px] flex-wrap gap-1">
          {REPORT_TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="mx-auto min-h-0 w-full max-w-[1400px] flex-1 overflow-y-auto">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
