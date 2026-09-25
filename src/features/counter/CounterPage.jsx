import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { useTabParam } from "@/hooks/useTabParam";
import { SetupNotice } from "./components/SetupNotice";
import { useShopToolsSetup } from "./hooks/useShopTools";
import AlterationsTab from "./alterations/AlterationsTab";
import ApprovalsTab from "./approvals/ApprovalsTab";
import BookingsTab from "./bookings/BookingsTab";

const TABS = [
  { value: "alterations", label: "Alterations", what: "Alterations", Component: AlterationsTab },
  { value: "approval", label: "On approval", what: "Goods on approval", Component: ApprovalsTab },
  { value: "bookings", label: "Bookings", what: "Advance bookings", Component: BookingsTab },
];

export default function CounterPage() {
  const [tab, setTab] = useTabParam("alterations");
  const setup = useShopToolsSetup();

  return (
    <div className="mx-auto flex h-full max-w-[1100px] flex-col gap-4 p-4">
      <PageHeader title="Counter" subtitle="Tailoring, approvals, bookings and exchanges" />

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-4">
        <TabsList className="w-full max-w-full justify-start overflow-x-auto sm:w-fit">
          {TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(({ value, what, Component }) => (
          <TabsContent key={value} value={value} className="min-h-0 flex-1 overflow-y-auto pb-6">
            {setup.ready ? <Component /> : <SetupNotice setup={setup} what={what} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
