import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryClient";
import { customerService } from "@/services/customerService";
import { normalizePhone } from "@/utils/invoice";

/** Adds a customer without leaving the bill. Calls onCreated with the saved customer. */
export function NewCustomerDialog({ open, onOpenChange, initialName = "", onCreated }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: initialName, phone: "", address: "", remarks: "" });
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));
  const digits = normalizePhone(form.phone);
  const phoneError = form.phone && digits.length !== 10 ? "Phone needs 10 digits" : null;
  const valid = form.name.trim() && !phoneError;

  const submit = async (event) => {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const [saved] = await customerService.create({
        name: form.name.trim(),
        phone: digits ? Number(digits) : null,
        address: form.address.trim(),
        remarks: form.remarks.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      onCreated(saved);
      onOpenChange(false);
      toast({ title: "Customer added", description: saved.name });
    } catch (error) {
      toast({ title: "Could not add customer", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto bg-surface text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" htmlFor="new-customer-name" required>
            {(id) => <Input id={id} value={form.name} onChange={set("name")} autoComplete="off" autoFocus />}
          </Field>
          <Field label="Phone" htmlFor="new-customer-phone" error={phoneError}>
            {(id) => <Input id={id} type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} autoComplete="off" />}
          </Field>
          <Field label="Address" htmlFor="new-customer-address">
            {(id) => <Input id={id} value={form.address} onChange={set("address")} autoComplete="off" />}
          </Field>
          <Field label="Remarks" htmlFor="new-customer-remarks">
            {(id) => <Input id={id} value={form.remarks} onChange={set("remarks")} autoComplete="off" />}
          </Field>
          <Button type="submit" disabled={!valid || saving} className="block-shadow h-12 w-full rounded-2xl font-display text-base font-extrabold">
            {saving ? "Adding…" : "Add customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
