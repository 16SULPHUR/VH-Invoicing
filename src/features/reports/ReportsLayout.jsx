import { NavLink, Outlet } from "react-router-dom";
import { Suspense } from "react";
import { PageLoader } from "@/components/common/PageLoader";

const REPORT_TABS = [
  { to: "transactions", label: "Transactions" },
  { to: "ledger", label: "Ledger" },
  { to: "trial-balance", label: "Trial Balance" },
  { to: "gst", label: "GST Report" },
];

const tabClass = ({ isActive }) =>
  `rounded-md px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-zinc-200 text-black" : "border border-gray-700 text-gray-300 hover:bg-gray-800"
  }`;

export default function ReportsLayout() {
  return (
    <div className="h-full w-full">
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-black/50 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-screen-xl flex-wrap gap-2">
          {REPORT_TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-screen-xl">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
