import { Link, Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { useTabParam } from "@/hooks/useTabParam";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useWhatsAppSettings } from "./hooks/useWhatsApp";
import { SendTab } from "./components/SendTab";
import { TemplatesTab } from "./components/TemplatesTab";

const TABS = [
  { value: "send", label: "Send", Component: SendTab },
  { value: "templates", label: "Templates", Component: TemplatesTab },
];

export default function WhatsAppPage() {
  const [tab, setTab] = useTabParam("send");
  const wa = useWhatsAppSettings();
  const isMobile = useIsMobile();

  if (tab === "rules") return <Navigate to="/settings?tab=whatsapp" replace />;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4">
      <PageHeader title="WhatsApp" subtitle={isMobile ? undefined : "Personal messages from the shop phone, one tap each."}
        actions={
          <Link to="/settings?tab=whatsapp" className="text-sm font-bold text-rani hover:underline">
            Sending rules
          </Link>
        }
      />
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-4">
        <TabsList className="w-fit max-w-full justify-start overflow-x-auto">
          {TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(({ value, Component }) => (
          <TabsContent key={value} value={value} forceMount className="mt-0 data-[state=inactive]:hidden">
            <Component wa={wa} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
