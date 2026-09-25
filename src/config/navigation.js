import {
  MessageCircle,
  ReceiptIndianRupee,
  PackageSearch,
  ScanBarcode,
  Users,
  Wallet,
  FileChartColumn,
} from "lucide-react";

// Single source of truth for navigation. Adding a screen means adding a route in
// app/router.jsx and an entry here. `short` is the phone tab label.
export const NAV_ITEMS = [
  { label: "New bill", short: "Bill", to: "/", icon: ReceiptIndianRupee, end: true, primary: true },
  { label: "Scan", short: "Scan", to: "/scan", icon: ScanBarcode, primary: true },
  { label: "Inventory", short: "Stock", to: "/inventory", icon: PackageSearch, primary: true },
  { label: "Customers", short: "Customers", to: "/customers", icon: Users, primary: true },
  { label: "WhatsApp", short: "WhatsApp", to: "/whatsapp", icon: MessageCircle, primary: false },
  { label: "Cashbook", short: "Cashbook", to: "/cashbook", icon: Wallet, primary: false },
  { label: "Reports", short: "Reports", to: "/reports", icon: FileChartColumn, primary: false },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primary);
export const MORE_NAV_ITEMS = NAV_ITEMS.filter((item) => !item.primary);

// Icon stroke weight is standardised across the app.
export const ICON_STROKE = 1.9;
