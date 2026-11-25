import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { useTabParam } from "@/hooks/useTabParam";
import { useShopSettings } from "./useShopSettings";
import { ShopSection } from "./sections/ShopSection";
import { BillsSection } from "./sections/BillsSection";
import { GstSection } from "./sections/GstSection";
import { WhatsAppSection } from "./sections/WhatsAppSection";
import { BooksSection } from "./sections/BooksSection";
import { DeviceSection } from "./sections/DeviceSection";

const TABS = [
  { value: "shop", label: "Shop", Component: ShopSection },
  { value: "bills", label: "Bills", Component: BillsSection },
  { value: "gst", label: "GST", Component: GstSection },
  { value: "whatsapp", label: "WhatsApp", Component: WhatsAppSection },
  { value: "books", label: "Books", Component: BooksSection },
  { value: "device", label: "This device", Component: DeviceSection },
];

export default function SettingsPage() {
  const [tab, setTab] = useTabParam("shop");
  const shop = useShopSettings();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4">
      <PageHeader title="Settings" subtitle="Everything the shop can change, in one place." />
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-4">
        <TabsList className="w-fit max-w-full justify-start overflow-x-auto">
          {TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(({ value, Component }) => (
          <TabsContent key={value} value={value} className="mt-0">
            <Component shop={shop} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
