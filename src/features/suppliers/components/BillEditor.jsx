import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Plus, ScanText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { env } from "@/config/env";
import { mediaService } from "@/services/mediaService";
import { localISODate } from "@/utils/date";
import { formatRupees, toNumber } from "@/utils/formatters";
import { ToolSheet } from "@/features/counter/components/ToolSheet";
import { TextArea } from "@/features/counter/components/Bits";
import { useGstSettings } from "@/features/reports/hooks/useGstSettings";
import { useEnteredBy } from "@/features/cashbook/hooks/useEnteredBy";
import { DEFAULT_CREDIT_DAYS, GST_RATES, addDays, gstSplit, isInterState, round2 } from "../lib/billMath";
import { readSupplierBill } from "../lib/readBill";
import { useSupplierBookMutations } from "../hooks/useSupplierBooks";
import { SupplierEditor } from "./SupplierEditor";

const normalize = (text) => String(text ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function matchSupplier(suppliers, read) {
  const gstin = String(read.gstin ?? "").trim().toUpperCase();
  const name = normalize(read.supplier_name);
  return (
    suppliers.find((supplier) => gstin && String(supplier.gstin ?? "").toUpperCase() === gstin) ??
    suppliers.find((supplier) => name && (normalize(supplier.name) === name || (name.length > 3 && normalize(supplier.name).includes(name))))
  );
}

function blank(today) {
  return { supplier_id: "", bill_no: "", bill_date: today, due_date: today, total: "", gst_rate: 5, hsn: "", igst: false, note: "" };
}

/** What the bill reader found, shown for checking before anything is put into the form. */
function ReadPreview({ read, supplier, suppliers, onUse, onDismiss }) {
  const itemsTotal = round2((read.items ?? []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  const rows = [
    ["Supplier", read.supplier_name ?? "—", supplier ? `Matches ${supplier.name}` : suppliers.length ? "Not in your supplier list" : null, true],
    ["GSTIN", read.gstin ?? "—", null, true],
    ["Bill no.", read.bill_no ?? "—", null, true],
    ["Bill date", read.bill_date ?? "—", null, true],
    ["GST", read.gst_rate != null ? `${read.gst_rate}%` : "—", null, false],
    ["HSN", read.hsn ?? "—", null, false],
    ["Total", read.total != null ? formatRupees(read.total) : "—", null, true],
  ];
  const mismatch = itemsTotal > 0 && read.total != null && Math.abs(itemsTotal - Number(read.total)) > 1;
  return (
    <div className="space-y-3 rounded-2xl border-[1.5px] border-marigold/60 bg-marigold/10 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-base font-bold">What was read from the photo</p>
          <p className="text-xs text-muted-foreground">Read on this phone, so mistakes happen, especially with handwriting. Check every field marked Check. Nothing is saved yet.</p>
        </div>
        <button type="button" onClick={onDismiss} className="press rounded-full p-1 hover:bg-black/5" aria-label="Dismiss">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(([label, value, note, important]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 font-semibold tabular-nums">
              {value === "—" ? <span className="text-destructive">Not found, type it in</span> : value}
              {value !== "—" && important && <span className="ml-2 rounded-full bg-marigold/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning">Check</span>}
              {note && <span className="ml-2 text-xs font-normal text-muted-foreground">{note}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {(read.items?.length ?? 0) > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold">{read.items.length} line{read.items.length === 1 ? "" : "s"} read</summary>
          <ul className="mt-1.5 divide-y divide-border/60 rounded-xl bg-surface px-3">
            {read.items.map((item, index) => (
              <li key={index} className="flex justify-between gap-3 py-1.5 text-xs">
                <span className="min-w-0 truncate">{item.description}{item.quantity != null && ` × ${item.quantity}`}</span>
                <span className="tabular-nums">{item.amount != null ? formatRupees(item.amount) : "—"}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {mismatch && (
        <p className="text-xs font-semibold text-warning">
          The lines add up to {formatRupees(itemsTotal)} but the total read is {formatRupees(read.total)}. Check the total.
        </p>
      )}
      {read.notes && <p className="text-xs text-muted-foreground">{read.notes}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="rani" size="sm" className="press" onClick={onUse}>Use these details</Button>
        <Button type="button" variant="outline" size="sm" onClick={onDismiss}>Ignore</Button>
      </div>
    </div>
  );
}

export function BillEditor({ bill, bills, suppliers, supplierById, open, onClose, defaultSupplierId }) {
  const { toast } = useToast();
  const { saveBill } = useSupplierBookMutations();
  const { gst } = useGstSettings();
  const [by] = useEnteredBy();
  const today = localISODate();
  const [form, setForm] = useState(() => blank(today));
  const [dueTouched, setDueTouched] = useState(false);
  const [photo, setPhoto] = useState({ file: null, url: null, existing: null });
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [read, setRead] = useState(null);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    if (!open) return;
    setRead(null);
    setDueTouched(Boolean(bill));
    setPhoto({ file: null, url: null, existing: bill?.photo_url ?? null });
    if (bill) {
      setForm({
        supplier_id: String(bill.supplier_id),
        bill_no: bill.bill_no,
        bill_date: bill.bill_date,
        due_date: bill.due_date,
        total: String(bill.total),
        gst_rate: Number(bill.gst_rate),
        hsn: bill.hsn ?? "",
        igst: bill.igst,
        note: bill.note ?? "",
      });
    } else {
      const supplier = supplierById.get(String(defaultSupplierId));
      setForm({
        ...blank(today),
        supplier_id: defaultSupplierId ? String(defaultSupplierId) : "",
        due_date: addDays(today, supplier?.credit_days ?? DEFAULT_CREDIT_DAYS),
        hsn: gst.defaultHsn ?? "",
        igst: supplier ? isInterState(supplier.gstin, gst.stateCode) : false,
      });
    }
  }, [open, bill, defaultSupplierId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => photo.url && URL.revokeObjectURL(photo.url), [photo.url]);

  const supplier = supplierById.get(form.supplier_id);
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const recalcDue = (next) => {
    if (dueTouched) return next;
    const days = supplierById.get(next.supplier_id)?.credit_days ?? DEFAULT_CREDIT_DAYS;
    return { ...next, due_date: addDays(next.bill_date || today, days) };
  };

  const pickSupplier = (id) => {
    const picked = supplierById.get(id);
    setForm((previous) => recalcDue({ ...previous, supplier_id: id, igst: picked ? isInterState(picked.gstin, gst.stateCode) : previous.igst }));
  };

  const { taxable, gst: gstAmount } = gstSplit(toNumber(form.total), form.gst_rate);

  const duplicate = useMemo(
    () => bills.find((other) => other.id !== bill?.id && String(other.supplier_id) === form.supplier_id && other.bill_no.trim().toLowerCase() === form.bill_no.trim().toLowerCase() && form.bill_no.trim()),
    [bills, bill, form.supplier_id, form.bill_no]
  );

  const chooseFile = (file) => {
    if (!file) return;
    setPhoto((previous) => ({ ...previous, file, url: URL.createObjectURL(file) }));
    setRead(null);
  };

  const readPhoto = async () => {
    setReading(true);
    setProgress(0);
    try {
      setRead(await readSupplierBill(photo.file, setProgress));
    } catch (error) {
      toast({ title: "Couldn't read the bill", description: error.message, variant: "destructive" });
    } finally {
      setReading(false);
    }
  };

  const useRead = () => {
    const match = matchSupplier(suppliers, read);
    setForm((previous) => {
      const next = { ...previous };
      if (match) {
        next.supplier_id = String(match.id);
        next.igst = isInterState(match.gstin, gst.stateCode);
      }
      if (read.bill_no) next.bill_no = String(read.bill_no);
      if (/^\d{4}-\d{2}-\d{2}$/.test(read.bill_date ?? "")) next.bill_date = read.bill_date;
      if (read.total != null) next.total = String(read.total);
      if (read.gst_rate != null) next.gst_rate = GST_RATES.includes(Number(read.gst_rate)) ? Number(read.gst_rate) : next.gst_rate;
      if (read.hsn) next.hsn = String(read.hsn);
      return recalcDue(next);
    });
    setRead(null);
    toast({ title: "Details filled in", description: "Check them, then save." });
  };

  const valid = form.supplier_id && form.bill_no.trim() && toNumber(form.total) > 0 && form.bill_date && form.due_date;

  const submit = async () => {
    let photoUrl = photo.existing;
    if (photo.file) {
      if (!env.mediaUploadUrl) {
        toast({ title: "Photo not stored", description: "Photo storage isn't set up (VITE_MEDIA_UPLOAD_URL), so the bill was saved without it." });
      } else {
        setUploading(true);
        try {
          photoUrl = await mediaService.uploadImage(photo.file);
        } catch (error) {
          setUploading(false);
          toast({ title: "Photo upload failed", description: error.message, variant: "destructive" });
          return;
        }
        setUploading(false);
      }
    }
    saveBill.mutate(
      {
        id: bill?.id,
        supplier_id: form.supplier_id,
        bill_no: form.bill_no.trim(),
        bill_date: form.bill_date,
        due_date: form.due_date,
        taxable_amount: taxable,
        gst_rate: Number(form.gst_rate),
        gst_amount: gstAmount,
        igst: form.igst,
        hsn: form.hsn.trim() || null,
        total: round2(toNumber(form.total)),
        photo_url: photoUrl,
        note: form.note.trim() || null,
        ...(bill ? {} : { created_by: by.trim() || null }),
      },
      { onSuccess: onClose }
    );
  };

  const preview = photo.url ?? photo.existing;

  return (
    <>
      <ToolSheet
        open={open}
        onClose={onClose}
        title={bill ? "Edit bill" : "New supplier bill"}
        description="Type it in, or photograph the paper bill and let it be read for you."
        footer={
          <>
            <Button variant="rani" className="press" disabled={!valid || saveBill.isPending || uploading} onClick={submit}>
              {saveBill.isPending || uploading ? "Saving…" : "Save bill"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="press" onClick={() => fileInput.current?.click()}>
              <Camera className="h-4 w-4" aria-hidden /> {preview ? "Change photo" : "Add bill photo"}
            </Button>
            {photo.file && (
              <Button type="button" variant="marigold" className="press" disabled={reading} onClick={readPhoto}>
                <ScanText className="h-4 w-4" aria-hidden /> {reading ? `Reading… ${Math.round(progress * 100)}%` : "Read bill"}
              </Button>
            )}
            <input ref={fileInput} type="file" accept="image/*" capture="environment" hidden onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = ""; }} />
          </div>
          {preview && <img src={preview} alt="Bill" className="max-h-56 w-full rounded-xl border border-border object-contain bg-surface" />}
        </div>

        {read && <ReadPreview read={read} supplier={matchSupplier(suppliers, read)} suppliers={suppliers} onUse={useRead} onDismiss={() => setRead(null)} />}

        <Field label="Supplier" required>
          {() => (
            <div className="flex gap-2">
              <Select value={form.supplier_id} onValueChange={pickSupplier}>
                <SelectTrigger><SelectValue placeholder="Pick a supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setAddingSupplier(true)} aria-label="Add supplier">
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Bill no." required error={duplicate ? "This supplier already has this bill number." : undefined}>
            {(id) => <Input id={id} value={form.bill_no} onChange={(event) => set("bill_no", event.target.value)} autoComplete="off" />}
          </Field>
          <Field label="Bill date" required>
            {(id) => <Input id={id} type="date" value={form.bill_date} onChange={(event) => setForm((previous) => recalcDue({ ...previous, bill_date: event.target.value }))} />}
          </Field>
        </div>

        <Field label="Due date" hint={supplier ? `${supplier.credit_days ?? DEFAULT_CREDIT_DAYS} credit days for ${supplier.name}.` : undefined}>
          {(id) => <Input id={id} type="date" value={form.due_date} onChange={(event) => { setDueTouched(true); set("due_date", event.target.value); }} />}
        </Field>

        <Field label="Bill total ₹" required hint="Final payable amount including GST.">
          {(id) => <Input id={id} type="number" inputMode="decimal" min={0} value={form.total} onChange={(event) => set("total", event.target.value)} className="tabular-nums" />}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="GST rate">
            {() => (
              <Select value={String(form.gst_rate)} onValueChange={(value) => set("gst_rate", Number(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GST_RATES.map((rate) => <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>)}</SelectContent>
              </Select>
            )}
          </Field>
          <Field label="HSN">{(id) => <Input id={id} value={form.hsn} onChange={(event) => set("hsn", event.target.value)} />}</Field>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3.5 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-semibold">{form.igst ? "IGST (other state)" : "CGST + SGST (Gujarat)"}</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              Taxable {formatRupees(taxable)} · GST {formatRupees(gstAmount)}
            </p>
          </div>
          <Switch checked={form.igst} onCheckedChange={(value) => set("igst", value)} aria-label="Inter-state bill" />
        </div>

        <Field label="Note">{(id) => <TextArea id={id} value={form.note} onChange={(event) => set("note", event.target.value)} placeholder="Broker, transport, LR no., anything to remember" />}</Field>
      </ToolSheet>
      <SupplierEditor open={addingSupplier} onClose={() => setAddingSupplier(false)} onSaved={(saved) => saved && pickSupplier(String(saved.id))} />
    </>
  );
}
