import React from "react";
import { AlertTriangle } from "lucide-react";

const OfflineInvoiceBanner = () => {
  return (
    <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-900/20 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-semibold text-amber-300 mb-2">
            You are creating this invoice offline
          </h4>
          <ul className="text-sm text-amber-200/80 space-y-1 list-disc list-inside">
            <li>Invoice number is temporary and will change after sync</li>
            <li>Do not clear browser data before syncing</li>
            <li>Stock levels may not be current</li>
            <li>Invoice will sync automatically when you go online</li>
            <li>Avoid creating duplicate invoices for the same order</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OfflineInvoiceBanner;
