import { useEffect, useState } from "react";
import { Printer, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { formatRupees } from "@/utils/formatters";
import { ToolSheet } from "../components/ToolSheet";
import { CustomerFields } from "../components/CustomerFields";
import { Chips } from "../components/Chips";
import { MoneyInput, StatusPill, TextArea } from "../components/Bits";
import { WhatsAppAction } from "../components/WhatsAppAction";
import { useSaveTool } from "../hooks/useShopTools";
import { usePrintSlip } from "../hooks/usePrintSlip";
import { useServiceMessage } from "../hooks/useServiceMessage";
import { JOB_KINDS, JOB_STATUSES, jobBalance, kindLabel, statusOf } from "../lib/jobs";
import { WORK_NAMES } from "../lib/messages";
import { jobSlip } from "../lib/slips";
import { addDays, rupees, todayLocal } from "../lib/shopTools";

const FIELDS = ["kind", "customer_name", "customer_phone", "items", "measurements", "charge", "advance", "ready_on", "status", "tailor"];

const blank = () => ({
  kind: "blouse",
  customer_name: "",
  customer_phone: "",
  items: "",
  measurements: "",
  charge: 0,
  advance: 0,
  ready_on: addDays(todayLocal(), 7),
  status: "received",
  tailor: "",
});

const pick = (record) => Object.fromEntries(FIELDS.map((key) => [key, record[key] ?? (key === "charge" || key === "advance" ? 0 : "")]));

export function JobSheet({ open, job, tailors, onClose, onSaved }) {
  const { toast } = useToast();
  const save = useSaveTool("service_jobs");
  const printSlip = usePrintSlip();
  const messages = useServiceMessage();
  const [draft, setDraft] = useState(blank);
  const [collecting, setCollecting] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDraft(job ? pick(job) : blank());
    setCollecting(null);
  }, [open, job]);

  const set = (changes) => setDraft((previous) => ({ ...previous, ...changes }));
  const isNew = !job;
  const dirty = isNew || FIELDS.some((key) => String(draft[key] ?? "") !== String(job[key] ?? (key === "charge" || key === "advance" ? 0 : "")));
  const balance = Math.max(0, rupees(draft.charge) - rupees(draft.advance) - rupees(job?.paid));
  const valid = draft.customer_name.trim().length > 0;
  const overpaid = rupees(draft.charge) > 0 && rupees(draft.advance) > rupees(draft.charge);

  const row = () => ({
    ...draft,
    customer_name: draft.customer_name.trim(),
    customer_phone: draft.customer_phone.trim() || null,
    tailor: draft.tailor.trim() || null,
    ready_on: draft.ready_on || null,
    charge: rupees(draft.charge),
    advance: rupees(draft.advance),
  });

  const submit = (print) =>
    save.mutate(
      { record: job, row: row() },
      {
        onSuccess: (saved) => {
          if (print) printSlip(jobSlip(saved));
          toast({ title: isNew ? `Token ${saved.token} saved` : `${saved.token} updated` });
          onSaved(saved);
        },
      }
    );

  const setStatus = (changes, done) =>
    save.mutate({ record: job, row: { ...row(), ...changes } }, { onSuccess: (saved) => done?.(saved) });

  const readyMessage = job
    ? messages.build("job_ready", job, { work: WORK_NAMES[job.kind] ?? WORK_NAMES.other, balance: jobBalance(job) })
    : null;

  const sendReady = (opened) => {
    if (opened) messages.record(readyMessage, "job_ready", `job:${job.token}`);
    setStatus({ status: "ready", notified_at: opened ? new Date().toISOString() : job.notified_at ?? null }, () =>
      toast({ title: `${job.token} is ready`, description: opened ? "WhatsApp opened with the message." : "No phone number, so no message." })
    );
  };

  const status = job ? statusOf(job.status) : null;
  const busy = save.isPending;

  const footer = isNew ? (
    <>
      <Button variant="outline" className="press flex-1" disabled={!valid || busy} onClick={() => submit(false)}>
        Save
      </Button>
      <Button className="press block-shadow flex-[2]" disabled={!valid || busy} onClick={() => submit(true)}>
        <Printer className="h-4 w-4" aria-hidden /> Save and print token
      </Button>
    </>
  ) : collecting !== null ? (
    <>
      <Button variant="outline" className="press flex-1" onClick={() => setCollecting(null)}>
        Back
      </Button>
      <Button
        className="press block-shadow flex-[2]"
        disabled={busy}
        onClick={() =>
          setStatus({ status: "delivered", paid: rupees(job.paid) + rupees(collecting), delivered_at: new Date().toISOString() }, () => {
            setCollecting(null);
            toast({ title: `${job.token} delivered`, description: collecting > 0 ? `${formatRupees(collecting)} collected.` : undefined });
            onClose();
          })
        }
      >
        Hand over{collecting > 0 ? ` · ${formatRupees(collecting)} paid` : ""}
      </Button>
    </>
  ) : (
    <>
      {dirty && (
        <Button className="press flex-1" disabled={!valid || busy} onClick={() => submit(false)}>
          Save changes
        </Button>
      )}
      {!dirty && job.status === "received" && (
        <Button variant="outline" className="press flex-1" disabled={busy} onClick={() => setStatus({ status: "with_tailor" })}>
          <Scissors className="h-4 w-4" aria-hidden /> Give to tailor
        </Button>
      )}
      {!dirty && (job.status === "received" || job.status === "with_tailor") && (
        <WhatsAppAction message={readyMessage} onSend={sendReady} disabled={busy} className="flex-[2]">
          Ready · tell customer
        </WhatsAppAction>
      )}
      {!dirty && job.status === "ready" && (
        <>
          {readyMessage.canSend && (
            <WhatsAppAction
              message={readyMessage}
              tone="outline"
              onSend={() => messages.record(readyMessage, "job_ready", `job:${job.token}`)}
              className="flex-1"
            >
              Remind
            </WhatsAppAction>
          )}
          <Button className="press block-shadow flex-[2]" disabled={busy} onClick={() => setCollecting(jobBalance(job))}>
            Deliver
          </Button>
        </>
      )}
      <Button variant="outline" size="icon" className="press h-10 w-10" onClick={() => printSlip(jobSlip(job))} aria-label="Print token">
        <Printer className="h-4 w-4" aria-hidden />
      </Button>
    </>
  );

  return (
    <ToolSheet
      open={open}
      onClose={onClose}
      title={isNew ? "New job" : `Token ${job.token}`}
      description={isNew ? "Fall-pico, blouse stitching or an alteration" : `${kindLabel(job.kind)} for ${job.customer_name || "a customer"}`}
      badge={status && <StatusPill solid tone={status.tone}>{status.label}</StatusPill>}
      footer={footer}
    >
      {collecting !== null ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-marigold/15 p-4">
            <p className="eyebrow">Balance to collect</p>
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{formatRupees(jobBalance(job))}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Charge {formatRupees(job.charge)} · advance {formatRupees(job.advance)}
              {rupees(job.paid) > 0 && ` · paid ${formatRupees(job.paid)}`}
            </p>
          </div>
          <Field label="Collected now" htmlFor="job-collect" hint="Enter 0 if the balance is to be paid later.">
            <MoneyInput id="job-collect" value={collecting} onChange={setCollecting} />
          </Field>
        </div>
      ) : (
        <>
          <Chips label="Kind of work" value={draft.kind} onChange={(kind) => set({ kind, ...(isNew ? { ready_on: addDays(todayLocal(), JOB_KINDS.find((item) => item.value === kind).days) } : {}) })} options={JOB_KINDS} />
          <CustomerFields idPrefix="job" name={draft.customer_name} phone={draft.customer_phone} onChange={set} />
          <Field label="Items" htmlFor="job-items" hint="What was handed over, e.g. 2 sarees (red, green), 1 blouse piece">
            <TextArea id="job-items" value={draft.items} onChange={(event) => set({ items: event.target.value })} />
          </Field>
          <Field label="Measurements and notes" htmlFor="job-notes">
            <TextArea id="job-notes" rows={3} value={draft.measurements ?? ""} onChange={(event) => set({ measurements: event.target.value })} placeholder="Bust 36, waist 30, sleeve 11, deep back neck…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ready on" htmlFor="job-ready">
              <Input id="job-ready" type="date" value={draft.ready_on ?? ""} onChange={(event) => set({ ready_on: event.target.value })} />
            </Field>
            <Field label="Tailor" htmlFor="job-tailor">
              <Input id="job-tailor" list="job-tailors" value={draft.tailor ?? ""} onChange={(event) => set({ tailor: event.target.value })} autoComplete="off" />
              <datalist id="job-tailors">
                {tailors.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Field>
            <Field label="Charge" htmlFor="job-charge">
              <MoneyInput id="job-charge" value={draft.charge} onChange={(charge) => set({ charge })} />
            </Field>
            <Field label="Advance paid" htmlFor="job-advance" hint={overpaid ? "More than the charge" : undefined}>
              <MoneyInput id="job-advance" value={draft.advance} onChange={(advance) => set({ advance })} />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-surface-elevated px-4 py-3">
            <span className="eyebrow">Balance at pickup</span>
            <span className="font-display text-2xl font-extrabold tabular-nums">{formatRupees(balance)}</span>
          </div>
          {!isNew && (
            <div className="space-y-1.5">
              <p className="eyebrow">Status</p>
              <Chips label="Status" value={draft.status} onChange={(value) => set({ status: value })} options={JOB_STATUSES} />
              {job.notified_at && <p className="text-xs text-muted-foreground">Customer told on WhatsApp {new Date(job.notified_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.</p>}
            </div>
          )}
        </>
      )}
    </ToolSheet>
  );
}
