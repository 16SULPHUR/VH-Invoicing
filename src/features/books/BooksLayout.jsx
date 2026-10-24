import { Suspense } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { PageLoader } from "@/components/common/PageLoader";
import { ReportRangePicker } from "@/features/reports/range/ReportRangePicker";

const TABS = [
  { to: "daybook", label: "Day book" },
  { to: "cash", label: "Cash book" },
  { to: "bank", label: "Bank book" },
  { to: "customers", label: "Customers", noRange: true },
  { to: "expenses", label: "Expenses" },
  { to: "ledger", label: "Ledger" },
  { to: "trial-balance", label: "Trial balance" },
  { to: "profit-loss", label: "Profit & loss" },
  { to: "balance-sheet", label: "Balance sheet" },
  { to: "opening", label: "Opening balances", noRange: true },
  { to: "settings", label: "Settings", noRange: true },
];

const tabClass = ({ isActive }) =>
  `press inline-flex h-full items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
    isActive ? "bg-indigo text-white" : "text-muted-foreground hover:text-foreground"
  }`;

export default function BooksLayout() {
  const location = useLocation();
  const current = TABS.find((tab) => location.pathname.endsWith(`/books/${tab.to}`));
  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Books" className="shrink-0 px-4 pt-4 md:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div className="inline-flex h-11 max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1">
            {TABS.map((tab) => (
              <NavLink key={tab.to} to={{ pathname: tab.to, search: location.search }} className={tabClass}>
                {tab.label}
              </NavLink>
            ))}
          </div>
          {!current?.noRange && <ReportRangePicker />}
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
