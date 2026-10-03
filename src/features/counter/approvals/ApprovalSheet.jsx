import { useEffect, useState } from "react";
import { Printer, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { formatRupees } from "@/utils/formatters";
import { useProducts } from "@/features/inventory/hooks/useInventory";
import { ToolSheet } from "../components/ToolSheet";
import { CustomerFields } from "../components/CustomerFields";
import { ProductSearch } from "../components/ProductSearch";
import { LineEditor, Stepper } from "../components/LineEditor";
import { Chips } from "../components/Chips";
import { DueText, StatusPill, TextArea } from "../components/Bits";
import { WhatsAppAction } from "../components/WhatsAppAction";
import { TillHandoff } from "../components/TillHandoff";
import { useSaveTool } from "../hooks/useShopTools";
import { usePrintSlip } from "../hooks/usePrintSlip";
import { useServiceMessage } from "../hooks/useServiceMessage";
import { useTillHandoff } from "../hooks/useTillHandoff";
import { outCount, outstanding, settleApproval } from "../lib/approvals";
import { piecesText } from "../lib/messages";
import { approvalSlip } from "../lib/slips";
import { addDays, addPiece, pieceCount, stockMoves, todayLocal } from "../lib/shopTools";

const DUE_CHIPS = [1, 2, 3, 7].map((days) => ({ value: days, label: days === 1 ? "Tomorrow" : `${days} days` }));

const blank = () => ({ customer_name: "", customer_phone: "", due_on: addDays(todayLocal(), 2), note: "", lines: [] });

function SettleLine({ line, pick, onPick }) {
  const left = outstanding(line);
  const returned = pick?.returned || 0;
  const sold = pick?.sold || 0;
  const done = left === 0;

  return (
    <li className="space-y-2 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{line.name}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {line.barcode ?? "No code"} · {formatRupees(line.price)} · {line.quantity} taken
            {line.returned > 0 && ` · ${line.returned} back`}
            {line.sold > 0 && ` · ${line.sold} kept${line.bill_no ? ` (bill #${line.bill_no})` : ""}`}
          </p>
        </div>
        {done ? <StatusPill tone="neutral">Settled</StatusPill> : <StatusPill tone="marigold">{left} out</StatusPill>}
      </div>
      {!done &&
        (left === 1 ? (
          <div className="grid grid-cols-2 gap-2">
            {[
              ["returned", "Came back"],
              ["sold", "Kept (bill it)"],
            ].map(([field, label]) => {
              const on = (field === "returned" ? returned : sold) === 1;
              return (
                <button
                  key={field}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPick(on ? { returned: 0, sold: 0 } : { returned: field === "returned" ? 1 : 0, sold: field === "sold" ? 1 : 0 })}
                  className={`press h-9 rounded-xl border-[1.5px] text-sm font-semibold transition-colors ${
                    on ? (field === "sold" ? "border-rani bg-rani text-white" : "border-indigo bg-indigo text-white") : "border-border bg-surface hover:bg-secondary"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-2">
              Came back
              <Stepper value={returned} min={0} max={left - sold} onChange={(value) => onPick({ returned: value, sold })} label="returned" />
            </span>
            <span className="flex items-center gap-2">
              Kept
              <Stepper value={sold} min={0} max={left - returned} onChange={(value) => onPick({ returned, sold: value })} label="kept" />
            </span>
          </div>
        ))}
    </li>
  );
}

export function ApprovalSheet({ open, approval, onClose, onSaved }) {
  const { toast } = useToast();
  const products = useProducts();
  const save = useSaveTool("approvals");
  const printSlip = usePrintSlip();
  const messages = useServiceMessage();
  const till = useTillHandoff();
  const [draft, setDraft] = useState(blank);
  const [picks, setPicks] = useState({});
  const [added, setAdded] = useState([]);

  useEffect(() => {
    if (!open) return;
    setDraft(approval ? { ...blank(), ...approval, note: approval.note ?? "" } : blank());
    setPicks({});
    setAdded([]);
  }, [open, approval?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (changes) => setDraft((previous) => ({ ...previous, ...changes }));
  const isNew = !approval;
  const closed = approval?.status === "closed";
  const busy = save.isPending;

  const issue = () => {
    const lines = draft.lines.map((line) => ({ ...line, returned: 0, sold: 0 }));
    save.mutate(
      {
        record: null,
        row: {
          customer_name: draft.customer_name.trim(),
          customer_phone: draft.customer_phone.trim() || null,
          due_on: draft.due_on || null,
          note: draft.note.trim() || null,
          lines,
        },
        moves: stockMoves(lines, -1).map((move) => ({ ...move, reason: "approval_out" })),
        reason: "approval_out",
      },
      {
        onSuccess: (saved) => {
          printSlip(approvalSlip(saved));
          toast({ title: `${saved.token} issued`, description: `${pieceCount(lines)} pieces out of stock until they come back.` });
          onSaved(saved);
        },
      }
    );
  };

  const settle = () => {
    const at = new Date().toISOString();
    const result = settleApproval(approval, picks, added, at);
    save.mutate(
      {
        record: approval,
        row: { lines: result.lines, status: result.closed ? "closed" : "open", closed_at: result.closed ? at : null },
        moves: result.moves,
      },
      {
        onSuccess: (saved) => {
          setPicks({});
          setAdded([]);
          const back = result.moves.filter((move) => move.reason === "approval_return").reduce((sum, move) => sum + move.delta, 0);
          toast({ title: `${saved.token} updated`, description: [back && `${back} back in stock`, result.sold.length && "kept pieces sent to the till"].filter(Boolean).join(", ") || undefined });
          if (result.sold.length > 0) {
            till.start({
              lines: result.sold,
              batch: at,
              customer: { name: saved.customer_name, phone: saved.customer_phone },
              note: `On approval ${saved.token}`,
            });
          } else if (result.closed) {
            onClose();
          }
        },
      }
    );
  };

  const saveBillNo = (billNo) => {
    const batch = till.handoff?.batch;
    save.mutate(
      { record: approval, row: { lines: approval.lines.map((line) => (line.till_at === batch ? { ...line, bill_no: billNo } : line)) } },
      { onSuccess: () => toast({ title: `Linked to bill #${billNo}` }) }
    );
  };

  const pending = Object.values(picks).reduce((sum, pick) => sum + (pick.returned || 0) + (pick.sold || 0), 0) + pieceCount(added);
  const allBack = () =>
    setPicks(Object.fromEntries(approval.lines.filter((line) => outstanding(line) > 0).map((line) => [line.key, { returned: outstanding(line), sold: 0 }])));

  const reminder = approval && !closed ? messages.build("approval_due", approval, { pieces: piecesText(outCount(approval)), due_date: approval.due_on }) : null;
  const lastReminder = approval ? messages.lastSent(reminder?.customer.key, `approval:${approval.token}`) : null;
  const valid = draft.customer_name.trim() && draft.lines.length > 0;

  const footer = isNew ? (
    <Button className="press block-shadow w-full" disabled={!valid || busy} onClick={issue}>
      <Printer className="h-4 w-4" aria-hidden /> Issue {pieceCount(draft.lines) || ""} pieces and print slip
    </Button>
  ) : closed ? (
    <Button variant="outline" className="press flex-1" onClick={() => printSlip(approvalSlip(approval))}>
      <Printer className="h-4 w-4" aria-hidden /> Print slip
    </Button>
  ) : (
    <>
      {pending === 0 && reminder?.canSend && (
        <WhatsAppAction
          message={reminder}
          tone="outline"
          className="flex-1"
          onSend={() => {
            messages.record(reminder, "approval_due", `approval:${approval.token}`);
            save.mutate({ record: approval, row: { notified_at: new Date().toISOString() } });
          }}
        >
          Remind
        </WhatsAppAction>
      )}
      <Button variant="outline" size="icon" className="press h-10 w-10" onClick={() => printSlip(approvalSlip(approval))} aria-label="Print slip">
        <Printer className="h-4 w-4" aria-hidden />
      </Button>
      <Button className="press block-shadow flex-[2]" disabled={pending === 0 || busy} onClick={settle}>
        {pending === 0 ? "Mark what came back" : `Save ${pending} piece${pending === 1 ? "" : "s"}`}
      </Button>
    </>
  );

  return (
    <>
      <ToolSheet
        open={open}
        onClose={onClose}
        title={isNew ? "Goods on approval" : `Jangad ${approval.token}`}
        description={isNew ? "Pieces the customer takes home to decide" : `${approval.customer_name || "Customer"} · due back`}
        badge={approval && (closed ? <StatusPill solid tone="neutral">Closed</StatusPill> : <StatusPill solid tone="marigold">{outCount(approval)} out</StatusPill>)}
        footer={footer}
      >
        {isNew ? (
          <>
            <CustomerFields idPrefix="approval" name={draft.customer_name} phone={draft.customer_phone} onChange={set} />
            <Field label="Pieces" htmlFor="approval-search">
              <ProductSearch id="approval-search" products={products.data} onPick={(product) => set({ lines: addPiece(draft.lines, product) })} />
            </Field>
            <LineEditor lines={draft.lines} onChange={(lines) => set({ lines })} products={products.data} emptyText="Scan or search the pieces going out." />
            <div className="space-y-1.5">
              <Field label="Bring back by" htmlFor="approval-due">
                <Input id="approval-due" type="date" value={draft.due_on ?? ""} onChange={(event) => set({ due_on: event.target.value })} />
              </Field>
              <Chips label="Quick dates" value={null} onChange={(days) => set({ due_on: addDays(todayLocal(), days) })} options={DUE_CHIPS} />
            </div>
            <Field label="Note" htmlFor="approval-note">
              <TextArea id="approval-note" value={draft.note} onChange={(event) => set({ note: event.target.value })} placeholder="Showing to family for a wedding…" />
            </Field>
            <p className="text-xs text-muted-foreground">These pieces leave stock now and go back in when they are returned.</p>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {approval.customer_phone || "No phone"} · <DueText date={approval.due_on} done={closed} prefix="Due " />
              </span>
              {lastReminder && <span className="text-xs text-muted-foreground">Reminded {new Date(lastReminder.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
            </div>
            {approval.note && <p className="rounded-xl bg-surface-elevated px-3 py-2 text-sm">{approval.note}</p>}
            {!closed && (
              <div className="flex items-center justify-between">
                <p className="eyebrow">What happened to each piece</p>
                <Button variant="ghost" size="sm" onClick={allBack}>
                  <Undo2 className="h-3.5 w-3.5" aria-hidden /> All came back
                </Button>
              </div>
            )}
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {approval.lines.map((line) => (
                <SettleLine key={line.key} line={line} pick={picks[line.key]} onPick={(pick) => setPicks((previous) => ({ ...previous, [line.key]: pick }))} />
              ))}
            </ul>
            {!closed && (
              <>
                <Field label="Took more pieces" htmlFor="approval-more">
                  <ProductSearch id="approval-more" products={products.data} onPick={(product) => setAdded((lines) => addPiece(lines, product))} />
                </Field>
                {added.length > 0 && <LineEditor lines={added} onChange={setAdded} products={products.data} />}
                <p className="text-xs text-muted-foreground">
                  Pieces that came back go into stock. Kept pieces go on the till&apos;s scan list, and the till takes them
                  out of stock when the bill is saved.
                </p>
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
          if (approval?.status === "closed") onClose();
        }}
      />
    </>
  );
}
