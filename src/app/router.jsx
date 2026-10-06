import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { RouteError } from "./ErrorBoundary";
import { PageLoader } from "@/components/common/PageLoader";

// Every screen is code-split so the initial bundle only carries the shell.
const InvoicingPage = lazy(() => import("@/features/invoicing/InvoicingPage"));
const ScannerPage = lazy(() => import("@/features/scanner/ScannerPage"));
const InventoryPage = lazy(() => import("@/features/inventory/InventoryPage"));
const CounterPage = lazy(() => import("@/features/counter/CounterPage"));
const CustomersPage = lazy(() => import("@/features/customers/CustomersPage"));
const WhatsAppPage = lazy(() => import("@/features/whatsapp/WhatsAppPage"));
const SuppliersPage = lazy(() => import("@/features/suppliers/SuppliersPage"));
const CashbookPage = lazy(() => import("@/features/cashbook/CashbookPage"));
const ReportsLayout = lazy(() => import("@/features/reports/ReportsLayout"));
const TransactionsPage = lazy(() => import("@/features/reports/pages/TransactionsPage"));
const LedgerPage = lazy(() => import("@/features/reports/pages/LedgerPage"));
const TrialBalancePage = lazy(() => import("@/features/reports/pages/TrialBalancePage"));
const PurchasesPage = lazy(() => import("@/features/reports/pages/PurchasesPage"));
const GstReportPage = lazy(() => import("@/features/reports/pages/GstReportPage"));
const OverviewPage = lazy(() => import("@/features/reports/pages/OverviewPage"));
const SalesPage = lazy(() => import("@/features/reports/pages/SalesPage"));
const ProductsPage = lazy(() => import("@/features/reports/pages/ProductsPage"));
const CustomersReportPage = lazy(() => import("@/features/reports/pages/CustomersReportPage"));
const StockPage = lazy(() => import("@/features/reports/pages/StockPage"));
const BooksLayout = lazy(() => import("@/features/reports/pages/BooksLayout"));
const StickerDesignerPage = lazy(() => import("@/features/inventory/stickers/designer/DesignerPage"));

export function createRouter({ onSignOut }) {
  // Phones open on the scanner, as before the router existed.
  if (window.location.pathname === "/" && window.matchMedia("(max-width: 767px)").matches) {
    window.history.replaceState(null, "", "/scan");
  }

  return createBrowserRouter([
    {
      // Full screen, outside the app shell, so the label gets the whole window.
      path: "/inventory/stickers/designer/:designId?",
      element: (
        <Suspense fallback={<PageLoader />}>
          <StickerDesignerPage />
        </Suspense>
      ),
      errorElement: <RouteError />,
    },
    {
      path: "/",
      element: <AppLayout onSignOut={onSignOut} />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <InvoicingPage /> },
        { path: "scan", element: <ScannerPage /> },
        { path: "counter", element: <CounterPage /> },
        { path: "inventory", element: <InventoryPage /> },
        { path: "customers", element: <CustomersPage /> },
        { path: "whatsapp", element: <WhatsAppPage /> },
        { path: "suppliers", element: <SuppliersPage /> },
        { path: "cashbook", element: <CashbookPage /> },
        {
          path: "reports",
          element: <ReportsLayout />,
          children: [
            { index: true, element: <Navigate to="overview" replace /> },
            { path: "overview", element: <OverviewPage /> },
            { path: "sales", element: <SalesPage /> },
            { path: "products", element: <ProductsPage /> },
            { path: "customers", element: <CustomersReportPage /> },
            { path: "stock", element: <StockPage /> },
            { path: "gst", element: <GstReportPage /> },
            { path: "purchases", element: <PurchasesPage /> },
            {
              path: "books",
              element: <BooksLayout />,
              children: [
                { index: true, element: <Navigate to="transactions" replace /> },
                { path: "transactions", element: <TransactionsPage /> },
                { path: "ledger", element: <LedgerPage /> },
                { path: "trial-balance", element: <TrialBalancePage /> },
              ],
            },
            { path: "transactions", element: <Navigate to="../books/transactions" replace /> },
            { path: "ledger", element: <Navigate to="../books/ledger" replace /> },
            { path: "trial-balance", element: <Navigate to="../books/trial-balance" replace /> },
          ],
        },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);
}
