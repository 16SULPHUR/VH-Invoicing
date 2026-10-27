import { useState } from "react";
import { BellOff, Check, ChevronDown, Loader2, Pencil, RotateCcw, Send, SkipForward, Undo2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Monogram } from "@/components/common/Monogram";
import { cn } from "@/lib/utils";
import { daysSince } from "@/features/customers/lib/customerKey";
import { formatRupees } from "@/utils/formatters";
import { MessageBubble } from "./MessageBubble";
import { waTarget } from "../lib/waLink";

const phoneText = (digits) => (digits ? `${digits.slice(0, 5)} ${digits.slice(5)}` : "No phone");
const ago = (date) => {
  const days = daysSince(date);
  return days === 0 ? "today" : `${days}d ago`;
};

function Chip({ children, tone = "bg-secondary text-muted-foreground" }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums", tone)}>{children}</span>;
}

function RowChips({ row, showTemplate, showDue }) {
  const { entry } = row;
  const age = entry.oldestDays;
  return (
    <div className="flex flex-wrap gap-1">
      {showDue && entry.due > 0 && <Chip tone="bg-credit/10 text-credit">{formatRupees(entry.due)} due</Chip>}
      {showDue && entry.due > 0 && (
        <Chip tone={age > 60 ? "bg-credit/10 text-credit" : age >= 30 ? "bg-marigold/20 text-warning" : undefined}>
          Oldest {age}d
        </Chip>
      )}
      {showTemplate && row.template && <Chip tone="bg-indigo/10 text-indigo">{row.template.name.replace(/^Dues · /, "")}</Chip>}
      {row.edited && <Chip tone="bg-accent text-accent-foreground">Edited</Chip>}
      {row.lastSent && <Chip>Messaged {ago(row.lastSent.created_at)}</Chip>}
    </div>
  );
}

/** A real link, so the phone hands it to WhatsApp and pop-up blockers stay quiet. */
function SendLink({ row, opener, waiting, onSend, className, children }) {
  if (waiting) {
    return (
      <span className={cn(className, "pointer-events-none opacity-60")} aria-disabled>
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Making pay link…
      </span>
    );
  }
  return (
    <a
      href={row.url}
      target={waTarget(opener)}
      rel="noopener noreferrer"
      // Log after the browser has followed this link, so the next row can't swap it first.
      onClick={() => setTimeout(() => onSend(row), 300)}
      className={className}
    >
      {children}
    </a>
  );
}

function MessageEditor({ row, onEdit, onReset }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-1.5">
      {editing ? (
        <textarea
          value={row.text}
          onChange={(event) => onEdit(row, event.target.value)}
          rows={Math.min(12, row.text.split("\n").length + 2)}
          aria-label={`Message to ${row.entry.name}`}
          className="w-full rounded-2xl border-[1.5px] border-input bg-surface px-3 py-2 text-[14px] leading-snug focus-visible:border-rani"
        />
      ) : (
        <MessageBubble text={row.text} />
      )}
      <div className="flex items-center gap-3 text-xs">
        <button type="button" onClick={() => setEditing((value) => !value)} className="press inline-flex items-center gap-1 font-bold text-indigo">
          <Pencil className="h-3.5 w-3.5" aria-hidden /> {editing ? "Done" : "Edit for this customer"}
        </button>
        {row.edited && (
          <button type="button" onClick={() => onReset(row)} className="press inline-flex items-center gap-1 font-bold text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Use template
          </button>
        )}
        {row.tooLong && <span className="ml-auto font-bold text-warning">Long: may get cut off</span>}
      </div>
    </div>
  );
}

const bigSend =
  "press flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-leaf font-display text-lg font-extrabold text-white shadow-[0_4px_0_hsl(154_63%_22%)] active:translate-y-[3px] active:shadow-[0_1px_0_hsl(154_63%_22%)]";

function FocusCard({ row, position, total, queue, onStopOffers }) {
  const { entry } = row;
  return (
    <section className="space-y-4 rounded-3xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))]">
      <div className="flex items-center gap-3">
        <p className="eyebrow shrink-0 tabular-nums">
          {position} of {total}
        </p>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden>
          <div className="h-full rounded-full bg-leaf transition-[width]" style={{ width: `${((position - 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Monogram name={entry.name || "?"} className="h-12 w-12 text-lg" />
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-extrabold leading-tight">{entry.name || "No name"}</h2>
          <p className="text-sm tabular-nums text-muted-foreground">{phoneText(entry.phone)}</p>
        </div>
      </div>
      <RowChips row={row} showTemplate={queue.templateId === "auto"} showDue={queue.kind === "dues"} />

      <MessageEditor row={row} onEdit={queue.editText} onReset={queue.resetText} />

      <SendLink row={row} opener={queue.opener} waiting={queue.waiting} onSend={queue.markSent} className={bigSend}>
        <Send className="h-5 w-5" aria-hidden /> Send on WhatsApp
      </SendLink>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => queue.markSkipped(row)}
          className="press flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-border text-[15px] font-bold hover:bg-secondary"
        >
          <SkipForward className="h-4 w-4" aria-hidden /> Skip
        </button>
        <button
          type="button"
          onClick={() => onStopOffers(row)}
          disabled={!entry.optin && Boolean(entry.optoutAt)}
          className="press flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-border text-[15px] font-bold text-muted-foreground hover:bg-secondary disabled:opacity-50"
        >
          <BellOff className="h-4 w-4" aria-hidden /> {!entry.optin && entry.optoutAt ? "Offers stopped" : "Stop offers"}
        </button>
      </div>
    </section>
  );
}

function ListRow({ row, queue, onStopOffers }) {
  const [open, setOpen] = useState(false);
  const { entry } = row;
  const done = row.status === "sent" || row.status === "skipped";
  return (
    <li className={cn("px-3.5 py-3", done && "bg-surface-elevated/60")}>
      <div className="flex items-start gap-3">
        <Monogram name={entry.name || "?"} className="h-9 w-9 text-sm" />
        <button type="button" onClick={() => setOpen((value) => !value)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <div className="flex items-baseline gap-2">
            <span className="truncate font-bold">{entry.name || "No name"}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{phoneText(entry.phone)}</span>
          </div>
          <div className="mt-1">
            <RowChips row={row} showTemplate={queue.templateId === "auto"} showDue={queue.kind === "dues"} />
          </div>
          {!open && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{row.text.replace(/\n/g, " · ").replace(/[*_~]/g, "")}</p>}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {done ? (
            <>
              <span className={cn("inline-flex items-center gap-1 text-xs font-bold", row.status === "sent" ? "text-success" : "text-muted-foreground")}>
                {row.status === "sent" && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                {row.status === "sent" ? "Sent" : "Skipped"}
              </span>
              <button type="button" onClick={() => queue.undo(row)} aria-label={`Undo ${entry.name}`} className="press rounded-full p-2 text-muted-foreground hover:bg-secondary">
                <Undo2 className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : (
            <>
              <SendLink
                row={row}
                opener={queue.opener}
                waiting={queue.waiting}
                onSend={queue.markSent}
                className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-leaf px-3.5 text-sm font-bold text-white hover:brightness-110"
              >
                <Send className="h-4 w-4" aria-hidden /> Send
              </SendLink>
              <button type="button" onClick={() => queue.markSkipped(row)} aria-label={`Skip ${entry.name}`} className="press rounded-full p-2 text-muted-foreground hover:bg-secondary">
                <SkipForward className="h-4 w-4" aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-2 pl-12">
          <MessageEditor row={row} onEdit={queue.editText} onReset={queue.resetText} />
          <button type="button" onClick={() => onStopOffers(row)} className="press inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <BellOff className="h-3.5 w-3.5" aria-hidden /> Stop offers
          </button>
        </div>
      )}
    </li>
  );
}

function HeldBack({ rows }) {
  if (rows.length === 0) return null;
  return (
    <details className="group rounded-2xl bg-surface shadow-[0_1px_0_hsl(var(--border))]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold">
        {rows.length} held back
        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="divide-y divide-dashed divide-border border-t border-border">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-3 px-4 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{row.entry.name || phoneText(row.entry.phone)}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{row.reason}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** One customer at a time (phone) or the whole list, with sends, skips and undo. */
export function Queue({ queue, mode, onStopOffers }) {
  const active = queue.rows.filter((row) => row.status !== "held");
  const held = queue.rows.filter((row) => row.status === "held");
  const pending = active.filter((row) => row.status === "ready");
  const sent = active.filter((row) => row.status === "sent").length;
  const skipped = active.filter((row) => row.status === "skipped").length;
  const current = pending[0];
  const lastDone = [...active].reverse().find((row) => row.status !== "ready");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="font-display text-3xl font-extrabold tabular-nums leading-none">
          {pending.length}
          <span className="ml-1.5 text-base font-bold text-muted-foreground">to send</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {sent} sent · {skipped} skipped{held.length > 0 && ` · ${held.length} held back`}
        </p>
      </div>

      {active.length === 0 ? (
        <EmptyState title="Nobody to message" description={held.length > 0 ? "Everyone here is held back, see why below." : "No customers match this group yet."} />
      ) : mode === "focus" ? (
        current ? (
          <FocusCard
            key={current.key}
            row={current}
            position={active.length - pending.length + 1}
            total={active.length}
            queue={queue}
            onStopOffers={onStopOffers}
          />
        ) : (
          <EmptyState title="Round done" description={`${sent} sent and ${skipped} skipped. Switch to List to review.`} />
        )
      ) : (
        <ul className="divide-y divide-dashed divide-border overflow-hidden rounded-2xl bg-surface shadow-[0_1px_0_hsl(var(--border))]">
          {active.map((row) => (
            <ListRow key={row.key} row={row} queue={queue} onStopOffers={onStopOffers} />
          ))}
        </ul>
      )}

      {mode === "focus" && lastDone && (
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate">
            {lastDone.status === "sent" ? "Opened for" : "Skipped"} <b>{lastDone.entry.name || phoneText(lastDone.entry.phone)}</b>
          </span>
          <button type="button" onClick={() => queue.undo(lastDone)} className="press inline-flex items-center gap-1 font-bold text-indigo">
            <Undo2 className="h-4 w-4" aria-hidden /> Undo
          </button>
        </div>
      )}

      <HeldBack rows={held} />
    </div>
  );
}
