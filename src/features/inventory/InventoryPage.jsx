import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabParam } from "@/hooks/useTabParam";
import { PageHeader } from "@/components/common/PageHeader";
import ManageProducts from "./ManageProducts";
import AddProductForm from "./components/AddProductForm";
import GenerateStickers from "./components/GenerateStickers";
import StockCountTab from "./count/StockCountTab";

const TABS = [
  { value: "manage", label: "Products", Component: ManageProducts },
  { value: "add", label: "Add product", Component: AddProductForm },
  { value: "stickers", label: "Stickers", Component: GenerateStickers },
  { value: "count", label: "Stock count", Component: StockCountTab },
];

export default function InventoryPage() {
  const [tab, setTab] = useTabParam("manage");

  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 p-4">
      <PageHeader title="Inventory" subtitle="Products, suppliers, labels and stock checks" />

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-4">
        <TabsList className="w-fit max-w-full justify-start overflow-x-auto">
          {TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(({ value, Component }) => (
          <TabsContent key={value} value={value} className="min-h-0 flex-1 overflow-y-auto">
            <Component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
