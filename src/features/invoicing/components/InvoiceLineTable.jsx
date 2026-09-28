import { Minus, PackageOpen, Pencil, Plus, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { formatRupees } from "@/utils/formatters";
import { swatchFor } from "@/utils/swatch";
import { ICON_STROKE } from "@/config/navigation";

const stepClass =
  "press flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-border text-muted-foreground hover:border-input hover:text-foreground disabled:opacity-40";

export function InvoiceLineTable({ lines, onEdit, onDelete, onChangeQuantity }) {
  if (lines.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No items yet"
        description="Scan a product, or search for one above."
      />
    );
  }

  return (
    <ul className="grid gap-2" aria-label="Items on this bill">
      {lines.map((line, index) => (
        <li
          key={`${line.name}-${index}`}
          className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-2xl bg-surface py-2 pl-2 pr-3 shadow-[0_1px_0_hsl(var(--border))] sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_5.5rem_auto]"
        >
          <span
            className="swatch h-10 w-10 rounded-xl"
            style={{ backgroundColor: swatchFor(line.name) }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold">{line.name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatRupees(line.price)} each
            </p>
          </div>

          <div className="col-start-3 row-start-1 text-right font-display text-base font-bold tabular-nums sm:col-start-4">
            {formatRupees(line.amount)}
          </div>

          <div className="col-span-2 col-start-2 flex items-center justify-between gap-2 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:justify-end">
            {onChangeQuantity ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={stepClass}
                  onClick={() => onChangeQuantity(index, -1)}
                  disabled={line.quantity <= 1}
                  aria-label={`One less ${line.name}`}
                >
                  <Minus size={14} strokeWidth={2.2} aria-hidden />
                </button>
                <span className="w-6 text-center font-bold tabular-nums">{line.quantity}</span>
                <button
                  type="button"
                  className={stepClass}
                  onClick={() => onChangeQuantity(index, 1)}
                  aria-label={`One more ${line.name}`}
                >
                  <Plus size={14} strokeWidth={2.2} aria-hidden />
                </button>
              </div>
            ) : (
              <span className="font-bold tabular-nums">× {line.quantity}</span>
            )}
            <div className="flex gap-0.5 sm:hidden">
              <LineActions line={line} index={index} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </div>

          <div className="hidden gap-0.5 sm:flex">
            <LineActions line={line} index={index} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function LineActions({ line, index, onEdit, onDelete }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onEdit(index)}
        aria-label={`Edit ${line.name}`}
        className="press rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Pencil size={15} strokeWidth={ICON_STROKE} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onDelete(index)}
        aria-label={`Remove ${line.name}`}
        className="press rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <X size={16} strokeWidth={ICON_STROKE} aria-hidden />
      </button>
    </>
  );
}
