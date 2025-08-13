import React, { useEffect, useState } from "react";
import Transactions from "./Transactions";
import Ledger from "./Ledger";
import TrialBalance from "./TrialBalance";
import GSTReport from "./GSTReport";
import { Button } from "@/components/ui/button";

const routes = [
  { path: "/transactions", label: "Transactions" },
  { path: "/ledger", label: "Ledger" },
  { path: "/trial-balance", label: "Trial Balance" },
  { path: "/gst-report", label: "GST Report" },
];

const Router = () => {
  const getPath = () => (window.location.hash || "#/transactions").replace("#", "");
  const [path, setPath] = useState(getPath());

  useEffect(() => {
    const handler = () => setPath(getPath());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const setRoute = (p) => {
    if (p === path) return;
    window.location.hash = p;
  };

  const render = () => {
    if (path === "/transactions") return <Transactions />;
    if (path === "/ledger") return <Ledger />;
    if (path === "/trial-balance") return <TrialBalance />;
    if (path === "/gst-report") return <GSTReport />;
    return <Transactions />;
  };

  return (
    <div className="w-full h-full">
      <div className="sticky top-0 z-10 bg-black/50 backdrop-blur border-b border-gray-800 px-4 md:px-6 py-3">
        <div className="max-w-screen-xl mx-auto flex flex-wrap gap-2">
          {routes.map((r) => (
            <Button
              key={r.path}
              variant={path === r.path ? "secondary" : "outline"}
              onClick={() => setRoute(r.path)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto">
        {render()}
      </div>
    </div>
  );
};

export default Router;


