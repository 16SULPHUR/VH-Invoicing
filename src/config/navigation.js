import { Home, PackageSearch, ScanBarcode, Users, Wallet, FileChartColumn } from "lucide-react";

// Single source of truth for the app's primary navigation. Adding a screen means
// adding a route in app/router.jsx and an entry here.
export const NAV_ITEMS = [
  { label: "Dashboard", to: "/", icon: Home, end: true },
  { label: "Scan Products", to: "/scan", icon: ScanBarcode },
  { label: "Inventory", to: "/inventory", icon: PackageSearch },
  { label: "Customers", to: "/customers", icon: Users },
  { label: "Cashbook", to: "/cashbook", icon: Wallet, primaryNav: false },
  { label: "Reports", to: "/reports", icon: FileChartColumn, primaryNav: false },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primaryNav !== false);
