import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageCustomers from "./components/ManageCustomers";
import AddCustomerForm from "./components/AddCustomerForm";
import CreditReport from "./components/CreditReport";

const TABS = [
  { value: "manage", label: "Manage Customers", Component: ManageCustomers },
  { value: "add", label: "Add Customer", Component: AddCustomerForm },
  { value: "reports", label: "Credit Report", Component: CreditReport },
];

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <h1 className="mb-4 text-2xl font-bold">Customer Management</h1>
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
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
