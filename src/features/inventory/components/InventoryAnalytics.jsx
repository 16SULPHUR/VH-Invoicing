import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TILES = [
  {
    title: "Inventory Summary",
    caption: "Unique Products",
    value: (a) => a.totalUniqueProducts.toLocaleString(),
  },
  {
    title: "Total Items",
    caption: "Items in Stock",
    value: (a) => a.totalItemsInStock.toLocaleString(),
  },
  {
    title: "Stock Value",
    caption: "Total inventory value",
    value: (a) => `₹${a.totalInventoryValue.toLocaleString()}`,
  },
];

export function InventoryAnalytics({ analytics }) {
  if (!analytics) return null;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {TILES.map(({ title, caption, value }) => (
        <Card key={title} className="bg-transparent text-white">
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value(analytics)}</div>
            <p className="text-sm text-gray-400">{caption}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StockAlerts({ analytics }) {
  if (!analytics?.lowStockItems && !analytics?.outOfStockItems) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Inventory Alert</AlertTitle>
      <AlertDescription>
        {analytics.outOfStockItems > 0 && <div>{analytics.outOfStockItems} items out of stock</div>}
        {analytics.lowStockItems > 0 && <div>{analytics.lowStockItems} items running low</div>}
      </AlertDescription>
    </Alert>
  );
}
