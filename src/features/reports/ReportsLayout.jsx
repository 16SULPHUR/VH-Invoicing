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
  `press inline-flex h-full items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
    isActive ? "bg-indigo text-white" : "text-muted-foreground hover:text-foreground"
  }`;

export default function ReportsLayout() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Reports" className="shrink-0 px-4 pt-4 md:px-6">
        <div className="mx-auto max-w-[1400px]">
        <div className="inline-flex h-11 max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1">
          {REPORT_TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
        </div>
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
