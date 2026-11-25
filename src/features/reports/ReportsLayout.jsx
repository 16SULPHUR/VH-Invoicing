import { Suspense } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { CompanyHeader } from "@/components/common/CompanyHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { ReportRangePicker } from "./range/ReportRangePicker";
import { ProfitToggle } from "./components/ProfitToggle";

const REPORT_TABS = [
  { to: "overview", label: "Overview", profit: true },
  { to: "sales", label: "Sales", profit: true },
  { to: "products", label: "Products", profit: true },
  { to: "customers", label: "Customers", profit: true },
  { to: "stock", label: "Stock", noRange: true },
  { to: "gst", label: "GST", noRange: true },
  { to: "purchases", label: "Purchases", noRange: true },
];

const tabClass = ({ isActive }) =>
  `press inline-flex h-full items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${
    isActive ? "bg-indigo text-white" : "text-muted-foreground hover:text-foreground"
  }`;

export default function ReportsLayout() {
  const location = useLocation();
  const current = REPORT_TABS.find((tab) => location.pathname.includes(`/reports/${tab.to}`));
  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Reports" className="shrink-0 px-4 pt-4 md:px-6">
        <CompanyHeader className="mx-auto mb-3 max-w-[1400px]" />
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div className="inline-flex h-11 max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1">
            {REPORT_TABS.map((tab) => (
              <NavLink key={tab.to} to={{ pathname: tab.to, search: location.search }} className={tabClass}>
                {tab.label}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {current?.profit && <ProfitToggle />}
            {!current?.noRange && <ReportRangePicker />}
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
