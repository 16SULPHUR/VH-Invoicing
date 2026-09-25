import { useEffect, useState } from "react";
import { Plus, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { formatRupees } from "@/utils/formatters";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { parseInvoiceLines } from "@/utils/invoice";
import { phoneDigits } from "@/features/customers/lib/customerKey";
import { useProducts } from "@/features/inventory/hooks/useInventory";
import { shopToolsService } from "@/services/shopToolsService";
import { ToolSheet } from "../components/ToolSheet";
import { CustomerFields } from "../components/CustomerFields";
import { ProductSearch } from "../components/ProductSearch";
import { LineEditor } from "../components/LineEditor";
import { Chips } from "../components/Chips";
import { MoneyInput, TextArea } from "../components/Bits";
import { useSaveTool } from "../hooks/useShopTools";
import { usePrintSlip } from "../hooks/usePrintSlip";
import { EXPIRY_CHOICES, productForBillLine } from "../lib/credit";
import { creditNoteSlip } from "../lib/slips";
import { addDays, addPiece, linesTotal, newKey, rupees, stockMoves, todayLocal } from "../lib/shopTools";

const blank = () => ({ customer_name: "", customer_phone: "", lines: [], note: "", expiry: 90, amount: null });

/** Take pieces back into stock and issue a credit note for them. */
export function ExchangeSheet({ open, onClose, onSaved }) {
  const { toast } = useToast();
  const products = useProducts();
  const save = useSaveTool("credit_notes");
  const printSlip = usePrintSlip();
  const [draft, setDraft] = useState(blank);
  const [billNo, setBillNo] = useState("");
  const [bill, setBill] = useState(null);
  const [looking, setLooking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(blank());
    setBillNo("");
    setBill(null);
  }, [open]);

  const set = (changes) => setDraft((previous) => ({ ...previous, ...changes }));
  const worth = linesTotal(draft.lines);
  const amount = draft.amount ?? worth;

  const findBill = async () => {
    if (!billNo) return;
    setLooking(true);
    try {
      const found = await shopToolsService.invoice(Number(billNo));
      setBill(found ?? false);
      if (found && !draft.customer_name) {
        set({ customer_name: found.customerName ?? "", customer_phone: phoneDigits(found.customerNumber) });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Couldn't find the bill", description: error.message });
    } finally {
      setLooking(false);
    }
  };

  const addBillLine = (line) => {
    const product = productForBillLine(products.data, line);
    const price = rupees(line.price);
    if (product) {
      const lines = addPiece(draft.lines, product);
      set({ lines: lines.map((item) => (item.product_id === String(product.id) ? { ...item, price } : item)) });
    } else {
      set({ lines: [...draft.lines, { key: newKey(), product_id: null, barcode: null, name: line.name, price, quantity: 1 }] });
    }
  };

  const submit = () => {
    const lines = draft.lines.map((line) => ({ ...line, price: rupees(line.price) }));
    save.mutate(
      {
        record: null,
        row: {
          customer_name: draft.customer_name.trim(),
          customer_phone: String(draft.customer_phone ?? "").trim() || null,
          amount: rupees(amount),
          lines,
          source_bill: bill ? bill.id : Number(billNo) || null,
          expires_on: draft.expiry ? addDays(todayLocal(), draft.expiry) : null,
          note: draft.note.trim() || null,
        },
        moves: stockMoves(lines, 1).map((move) => ({ ...move, reason: "exchange_return" })),
      },
      {
        onSuccess: (saved) => {
          printSlip(creditNoteSlip(saved));
          toast({ title: `Credit note ${saved.token} for ${formatRupees(saved.amount)}`, description: "Returned pieces are back in stock." });
          onSaved(saved);
        },
      }
    );
  };

  const valid = draft.lines.length > 0 && rupees(amount) > 0;
  const untracked = draft.lines.filter((line) => !line.product_id);

  return (
    <ToolSheet
      open={open}
      onClose={onClose}
      title="Take back"
      description="Pieces come back into stock and the customer gets a credit note"
      footer={
        <Button className="press block-shadow w-full" disabled={!valid || save.isPending} onClick={submit}>
          <Printer className="h-4 w-4" aria-hidden /> Issue credit note for {formatRupees(amount)}
        </Button>
      }
    >
      <div className="space-y-2">
        <Field label="Original bill number (optional)" htmlFor="exchange-bill">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              findBill();
            }}
          >
            <Input id="exchange-bill" inputMode="numeric" value={billNo} onChange={(event) => setBillNo(event.target.value.replace(/\D/g, ""))} />
            <Button type="submit" variant="outline" disabled={!billNo || looking}>
              <Search className="h-4 w-4" aria-hidden /> Find
            </Button>
          </form>
        </Field>
        {bill === false && <p className="text-sm text-destructive">No bill #{billNo} found.</p>}
        {bill && (
          <div className="rounded-2xl border border-border bg-surface p-3">
            <p className="text-sm font-semibold">
              Bill #{bill.id} · {bill.customerName || "Walk-in"} · {formatDateDDMMMYYYY(bill.date)}
            </p>
            <p className="mb-2 text-xs text-muted-foreground">Tap what came back.</p>
            <div className="flex flex-wrap gap-1.5">
              {parseInvoiceLines(bill.products).map((line, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addBillLine(line)}
                  className="press inline-flex max-w-full items-center gap-1 rounded-full border-[1.5px] border-border px-3 py-1 text-xs font-semibold hover:border-indigo/40"
                >
                  <Plus className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{line.name}</span>
                  <span className="shrink-0 text-muted-foreground">{formatRupees(line.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Field label="Pieces coming back" htmlFor="exchange-search">
        <ProductSearch id="exchange-search" products={products.data} onPick={(product) => set({ lines: addPiece(draft.lines, product) })} />
      </Field>
      <LineEditor lines={draft.lines} onChange={(lines) => set({ lines, amount: null })} products={products.data} emptyText="Scan the tag, search, or pick from the bill." />
      {untracked.length > 0 && (
        <p className="text-xs text-warning">
          {untracked.map((line) => line.name).join(", ")} {untracked.length === 1 ? "is" : "are"} not in the product list, so stock is not changed for {untracked.length === 1 ? "it" : "them"}.
        </p>
      )}

      <CustomerFields idPrefix="exchange" required={false} name={draft.customer_name} phone={draft.customer_phone} onChange={set} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Credit note amount" htmlFor="exchange-amount" hint={draft.amount !== null && draft.amount !== worth ? `Pieces are worth ${formatRupees(worth)}` : undefined}>
          <MoneyInput id="exchange-amount" value={amount} onChange={(value) => set({ amount: value })} />
        </Field>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Valid for</p>
          <Chips label="Valid for" value={draft.expiry} onChange={(expiry) => set({ expiry })} options={EXPIRY_CHOICES} />
        </div>
      </div>
      <Field label="Note" htmlFor="exchange-note">
        <TextArea id="exchange-note" value={draft.note} onChange={(event) => set({ note: event.target.value })} placeholder="Size exchange, colour did not suit…" />
      </Field>
    </ToolSheet>
  );
}
