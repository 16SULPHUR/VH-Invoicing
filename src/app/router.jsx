import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { RouteError } from "./ErrorBoundary";

// Every screen is code-split so the initial bundle only carries the shell.
const InvoicingPage = lazy(() => import("@/features/invoicing/InvoicingPage"));
const ScannerPage = lazy(() => import("@/features/scanner/ScannerPage"));
const InventoryPage = lazy(() => import("@/features/inventory/InventoryPage"));
const CustomersPage = lazy(() => import("@/features/customers/CustomersPage"));
const CashbookPage = lazy(() => import("@/features/cashbook/CashbookPage"));
const ReportsLayout = lazy(() => import("@/features/reports/ReportsLayout"));
const TransactionsPage = lazy(() => import("@/features/reports/pages/TransactionsPage"));
const LedgerPage = lazy(() => import("@/features/reports/pages/LedgerPage"));
const TrialBalancePage = lazy(() => import("@/features/reports/pages/TrialBalancePage"));
const GstReportPage = lazy(() => import("@/features/reports/pages/GstReportPage"));

export function createRouter({ onSignOut }) {
  return createBrowserRouter([
    {
      path: "/",
      element: <AppLayout onSignOut={onSignOut} />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <InvoicingPage /> },
        { path: "scan", element: <ScannerPage /> },
        { path: "inventory", element: <InventoryPage /> },
        { path: "customers", element: <CustomersPage /> },
        { path: "cashbook", element: <CashbookPage /> },
        {
          path: "reports",
          element: <ReportsLayout />,
          children: [
            { index: true, element: <Navigate to="transactions" replace /> },
            { path: "transactions", element: <TransactionsPage /> },
            { path: "ledger", element: <LedgerPage /> },
            { path: "trial-balance", element: <TrialBalancePage /> },
            { path: "gst", element: <GstReportPage /> },
          ],
        },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);
}
