import { useEffect, useState } from "react";
import { PackageCheck, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { formatRupees } from "@/utils/formatters";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { useProducts } from "@/features/inventory/hooks/useInventory";
import { ToolSheet } from "../components/ToolSheet";
import { CustomerFields } from "../components/CustomerFields";
import { ProductSearch } from "../components/ProductSearch";
import { LineEditor } from "../components/LineEditor";
import { DueText, MoneyInput, StatusPill, TextArea } from "../components/Bits";
import { WhatsAppAction } from "../components/WhatsAppAction";
import { TillHandoff } from "../components/TillHandoff";
import { useSaveTool } from "../hooks/useShopTools";
import { usePrintSlip } from "../hooks/usePrintSlip";
import { useServiceMessage } from "../hooks/useServiceMessage";
import { useTillHandoff } from "../hooks/useTillHandoff";
import { bookingBalance, bookingStatus, isOpenBooking } from "../lib/bookings";
import { bookingSlip } from "../lib/slips";
import { addDays, addPiece, heldDiff, linesTotal, newKey, rupees, stockMoves, todayLocal } from "../lib/shopTools";

const blank = () => ({ customer_name: "", customer_phone: "", lines: [], advance: 0, pickup_on: addDays(todayLocal(), 14), note: "" });
const holdReason = (move) => ({ ...move, reason: move.delta < 0 ? "booking_hold" : "booking_release" });

export function BookingSheet({ open, booking, onClose, onSaved }) {
  const { toast } = useToast();
  const products = useProducts();
  const save = useSaveTool("bookings");
  const saveNote = useSaveTool("credit_notes");
  const printSlip = usePrintSlip();
  const messages = useServiceMessage();
  const till = useTillHandoff();
  const [draft, setDraft] = useState(blank);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDraft(booking ? { ...blank(), ...booking, note: booking.note ?? "" } : blank());
    setCancelling(null);
  }, [open, booking]);

  const set = (changes) => setDraft((previous) => ({ ...previous, ...changes }));
  const isNew = !booking;
  const editable = isNew || isOpenBooking(booking);
  const total = linesTotal(draft.lines);
  const busy = save.isPending || saveNote.isPending;
  const valid = draft.customer_name.trim() && draft.lines.length > 0 && draft.lines.every((line) => line.name.trim());
  const dirty =
    isNew ||
    (editable &&
      (JSON.stringify(draft.lines) !== JSON.stringify(booking.lines) ||
        ["customer_name", "customer_phone", "advance", "pickup_on", "note"].some((key) => String(draft[key] ?? "") !== String(booking[key] ?? ""))));

  const row = () => ({
    customer_name: draft.customer_name.trim(),
    customer_phone: String(draft.customer_phone ?? "").trim() || null,
    lines: draft.lines.map((line) => ({ ...line, name: line.name.trim(), price: rupees(line.price) })),
    total,
    advance: rupees(draft.advance),
    pickup_on: draft.pickup_on || null,
    note: draft.note.trim() || null,
  });

  const submit = () => {
    const next = row();
    const moves = isNew ? stockMoves(next.lines, -1).map(holdReason) : heldDiff(booking.lines, next.lines).map(holdReason);
    save.mutate(
      { record: booking, row: next, moves },
      {
        onSuccess: (saved) => {
          if (isNew) printSlip(bookingSlip(saved));
          toast({ title: isNew ? `Booking ${saved.token} saved` : `${saved.token} updated`, description: moves.length ? "Stock pieces are held for this customer." : undefined });
          onSaved(saved);
        },
      }
    );
  };

  const readyMessage = booking && isOpenBooking(booking) ? messages.build("booking_ready", booking, { balance: bookingBalance(booking) }) : null;

  const markReady = (opened) => {
    if (opened) messages.record(readyMessage, "booking_ready", `booking:${booking.token}`);
    save.mutate(
      { record: booking, row: { status: "ready", notified_at: opened ? new Date().toISOString() : booking.notified_at ?? null } },
      { onSuccess: (saved) => toast({ title: `${saved.token} is ready` }) }
    );
  };

  const pickup = () => {
    const at = new Date().toISOString();
    const stockLines = booking.lines.filter((line) => line.product_id);
    save.mutate(
      {
        record: booking,
        row: { status: "picked_up", till_at: at },
        moves: stockMoves(stockLines, 1).map((move) => ({ ...move, reason: "booking_pickup" })),
      },
      {
        onSuccess: (saved) =>
          till.start({
            lines: stockLines,
            manual: booking.lines.filter((line) => !line.product_id),
            customer: { name: saved.customer_name, phone: saved.customer_phone },
            note: `Booking ${saved.token}: advance ${formatRupees(saved.advance)} paid ${formatDateDDMMMYYYY(saved.created_at)}, balance ${formatRupees(bookingBalance(saved))}`,
            paidBefore: rupees(saved.advance),
            paidLabel: `advance was paid on ${formatDateDDMMMYYYY(saved.created_at)}`,
          }),
      }
    );
  };

  const cancel = () => {
    const refundAsNote = cancelling.creditNote && rupees(booking.advance) > 0;
    save.mutate(
      {
        record: booking,
        row: { status: "cancelled", note: [booking.note, cancelling.reason && `Cancelled: ${cancelling.reason}`].filter(Boolean).join(" · ") || null },
        moves: stockMoves(booking.lines, 1).map((move) => ({ ...move, reason: "booking_cancel" })),
      },
      {
        onSuccess: (saved) => {
          setCancelling(null);
          if (!refundAsNote) {
            toast({ title: `${saved.token} cancelled`, description: "Held pieces are back in stock." });
            return onClose();
          }
          saveNote.mutate(
            {
              record: null,
              row: {
                customer_name: saved.customer_name,
                customer_phone: saved.customer_phone,
                amount: rupees(saved.advance),
                lines: [],
                note: `Advance from cancelled booking ${saved.token}`,
                expires_on: addDays(todayLocal(), 180),
              },
            },
            {
              onSuccess: (note) => {
                toast({ title: `Credit note ${note.token} for ${formatRupees(note.amount)}`, description: "Find it under Exchanges." });
                onClose();
              },
            }
          );
        },
      }
    );
  };

  const saveBillNo = (billNo) =>
    save.mutate({ record: booking, row: { bill_no: billNo } }, { onSuccess: () => toast({ title: `Linked to bill #${billNo}` }) });

  const status = booking ? bookingStatus(booking.status) : null;

  let footer;
  if (cancelling) {
    footer = (
      <>
        <Button variant="outline" className="press flex-1" onClick={() => setCancelling(null)}>
          Keep booking
        </Button>
        <Button variant="destructive" className="press flex-[2]" disabled={busy} onClick={cancel}>
          Cancel booking
        </Button>
      </>
    );
  } else if (isNew || dirty) {
    footer = (
      <Button className="press block-shadow w-full" disabled={!valid || busy} onClick={submit}>
        {isNew ? (
          <>
            <Printer className="h-4 w-4" aria-hidden /> Save and print receipt
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    );
  } else if (editable) {
    footer = (
      <>
        <Button variant="outline" size="icon" className="press h-10 w-10" onClick={() => printSlip(bookingSlip(booking))} aria-label="Print receipt">
          <Printer className="h-4 w-4" aria-hidden />
        </Button>
        {booking.status === "booked" ? (
          <WhatsAppAction message={readyMessage} onSend={markReady} disabled={busy} tone="outline" className="flex-1">
            Ready
          </WhatsAppAction>
        ) : (
          readyMessage.canSend && (
            <WhatsAppAction
              message={readyMessage}
              tone="outline"
              className="flex-1"
              onSend={() => messages.record(readyMessage, "booking_ready", `booking:${booking.token}`)}
            >
              Remind
            </WhatsAppAction>
          )
        )}
        <Button className="press block-shadow flex-[2]" disabled={busy} onClick={pickup}>
          <PackageCheck className="h-4 w-4" aria-hidden /> Picked up · bill it
        </Button>
      </>
    );
  } else {
    footer = (
      <Button variant="outline" className="press w-full" onClick={() => printSlip(bookingSlip(booking))}>
        <Printer className="h-4 w-4" aria-hidden /> Print receipt
      </Button>
    );
  }

  return (
    <>
      <ToolSheet
        open={open}
        onClose={onClose}
        title={isNew ? "New booking" : `Booking ${booking.token}`}
        description={isNew ? "Hold pieces or take a custom order against an advance" : booking.customer_name || "Customer"}
        badge={status && <StatusPill solid tone={status.tone}>{status.label}</StatusPill>}
        footer={footer}
      >
        {cancelling ? (
          <div className="space-y-4">
            <p className="text-sm">
              Held stock pieces go back on the shelf. The advance was <b>{formatRupees(booking.advance)}</b>.
            </p>
            {rupees(booking.advance) > 0 && (
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 text-sm">
                <Checkbox checked={cancelling.creditNote} onCheckedChange={(value) => setCancelling({ ...cancelling, creditNote: value === true })} className="mt-0.5" />
                <span>
                  <b>Give a credit note</b> for {formatRupees(booking.advance)} instead of cash back
                  <span className="block text-xs text-muted-foreground">Valid for 6 months; it shows under Exchanges.</span>
                </span>
              </label>
            )}
            <Field label="Reason (optional)" htmlFor="booking-cancel-reason">
              <Input id="booking-cancel-reason" value={cancelling.reason} onChange={(event) => setCancelling({ ...cancelling, reason: event.target.value })} />
            </Field>
          </div>
        ) : (
          <>
            {!isNew && (
              <p className="text-sm">
                {booking.customer_phone || "No phone"} ·{" "}
                <DueText date={booking.pickup_on} done={!isOpenBooking(booking)} prefix="Pickup " />
                {booking.bill_no && <span className="text-muted-foreground"> · bill #{booking.bill_no}</span>}
              </p>
            )}
            {editable ? (
              <>
                <CustomerFields idPrefix="booking" name={draft.customer_name} phone={draft.customer_phone} onChange={set} />
                <Field label="Items" htmlFor="booking-search" hint="Stock pieces are held off the shelf until pickup.">
                  <ProductSearch id="booking-search" products={products.data} onPick={(product) => set({ lines: addPiece(draft.lines, product) })} />
                </Field>
                <LineEditor lines={draft.lines} onChange={(lines) => set({ lines })} products={products.data} editableNames emptyText="Add stock pieces, or a custom order below." />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => set({ lines: [...draft.lines, { key: newKey(), product_id: null, barcode: null, name: "", price: 0, quantity: 1 }] })}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Custom order item
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Advance paid" htmlFor="booking-advance">
                    <MoneyInput id="booking-advance" value={draft.advance} onChange={(advance) => set({ advance })} />
                  </Field>
                  <Field label="Pickup date" htmlFor="booking-pickup">
                    <Input id="booking-pickup" type="date" value={draft.pickup_on ?? ""} onChange={(event) => set({ pickup_on: event.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-elevated px-4 py-3">
                  <div>
                    <p className="eyebrow">Total</p>
                    <p className="font-display text-xl font-extrabold tabular-nums">{formatRupees(total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="eyebrow">Balance at pickup</p>
                    <p className="font-display text-xl font-extrabold tabular-nums text-rani">{formatRupees(Math.max(0, total - rupees(draft.advance)))}</p>
                  </div>
                </div>
                <Field label="Note" htmlFor="booking-note">
                  <TextArea id="booking-note" value={draft.note} onChange={(event) => set({ note: event.target.value })} placeholder="Wedding on 12 Dec, blouse measurements with Salma…" />
                </Field>
                {!isNew && (
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setCancelling({ creditNote: false, reason: "" })}>
                    Cancel this booking
                  </Button>
                )}
              </>
            ) : (
              <>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface text-sm">
                  {booking.lines.map((line) => (
                    <li key={line.key} className="flex justify-between gap-3 px-3 py-2">
                      <span className="truncate">
                        {line.name} <span className="text-muted-foreground">×{line.quantity}</span>
                      </span>
                      <span className="tabular-nums">{formatRupees(line.price * line.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  Total {formatRupees(booking.total)} · advance {formatRupees(booking.advance)}
                  {booking.note && ` · ${booking.note}`}
                </p>
                {booking.status === "picked_up" && !booking.bill_no && (
                  <form
                    className="flex items-end gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const value = Number(new FormData(event.currentTarget).get("bill"));
                      if (value > 0) saveBillNo(value);
                    }}
                  >
                    <Field label="Bill number" htmlFor="booking-bill" className="flex-1">
                      <Input id="booking-bill" name="bill" inputMode="numeric" />
                    </Field>
                    <Button type="submit" variant="outline">
                      Link bill
                    </Button>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </ToolSheet>
      <TillHandoff
        handoff={till.handoff}
        retrying={till.retrying}
        onRetry={till.retry}
        onBillNo={saveBillNo}
        onClose={() => {
          till.close();
          onClose();
        }}
      />
    </>
  );
}
