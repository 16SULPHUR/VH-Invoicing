import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAddCustomer } from "../hooks/useCustomers";

const EMPTY_CUSTOMER = { name: "", address: "", phone: "" };
const FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "phone", label: "Phone", type: "tel" },
];

export default function AddCustomerForm() {
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const addCustomer = useAddCustomer();

  const handleSubmit = (event) => {
    event.preventDefault();
    addCustomer.mutate(customer, { onSuccess: () => setCustomer(EMPTY_CUSTOMER) });
  };

  return (
    <Card className="bg-transparent text-white">
      <CardHeader>
        <CardTitle>Add New Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {FIELDS.map(({ key, label, type }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={type}
                value={customer[key]}
                onChange={(event) =>
                  setCustomer((previous) => ({ ...previous, [key]: event.target.value }))
                }
                required
              />
            </div>
          ))}
          <Button type="submit" disabled={addCustomer.isPending}>
            {addCustomer.isPending ? "Adding…" : "Add Customer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
