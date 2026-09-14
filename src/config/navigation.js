import { Home, PackageSearch, ScanBarcode, Users, Wallet, FileChartColumn } from "lucide-react";

// Single source of truth for navigation. Adding a screen means adding a route in
// app/router.jsx and an entry here.
export const NAV_ITEMS = [
  { label: "Till", to: "/", icon: Home, end: true, primary: true },
  { label: "Scan", to: "/scan", icon: ScanBarcode, primary: true },
  { label: "Inventory", to: "/inventory", icon: PackageSearch, primary: true },
  { label: "Customers", to: "/customers", icon: Users, primary: true },
  { label: "Cashbook", to: "/cashbook", icon: Wallet, primary: true },
  { label: "Reports", to: "/reports", icon: FileChartColumn, primary: false },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primary);

// Icon stroke weight is standardised across the app.
export const ICON_STROKE = 1.75;
