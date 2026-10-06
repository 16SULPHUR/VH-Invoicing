import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabParam } from "@/hooks/useTabParam";
import { PageHeader } from "@/components/common/PageHeader";
import ManageCustomers from "./components/ManageCustomers";
import AddCustomerForm from "./components/AddCustomerForm";
import CreditReport from "./components/CreditReport";

const TABS = [
  { value: "reports", label: "Credit", Component: CreditReport },
  { value: "manage", label: "Customers", Component: ManageCustomers },
  { value: "add", label: "Add customer", Component: AddCustomerForm },
];

export default function CustomersPage() {
  const [tab, setTab] = useTabParam("reports");

  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 p-4">
      <PageHeader title="Customers" subtitle="Directory and outstanding credit" />

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
