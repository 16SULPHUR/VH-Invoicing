import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageProducts from "./ManageProducts";
import AddProductForm from "./components/AddProductForm";
import GenerateStickers from "./components/GenerateStickers";

const TABS = [
  { value: "manage", label: "Manage Products", Component: ManageProducts },
  { value: "add", label: "Add Product", Component: AddProductForm },
  { value: "stickers", label: "Generate Stickers", Component: GenerateStickers },
];

export default function InventoryPage() {
  return (
    <div className="h-screen bg-gray-900 px-2 text-gray-100">
      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-300 text-black">
          {TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(({ value, Component }) => (
          <TabsContent key={value} value={value}>
            <Component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
