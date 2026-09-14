import { PackageOpen, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { formatAmount } from "@/utils/formatters";
import { ICON_STROKE } from "@/config/navigation";

export function InvoiceLineTable({ lines, onEdit, onDelete }) {
  if (lines.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No items yet"
        description="Scan a product or add one using the row above."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Items on this invoice</caption>
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">
              Item
            </th>
            <th scope="col" className="w-20 px-3 py-2 text-right font-medium">
              Qty
            </th>
            <th scope="col" className="w-28 px-3 py-2 text-right font-medium">
              Price
            </th>
            <th scope="col" className="w-28 px-3 py-2 text-right font-medium">
              Amount
            </th>
            <th scope="col" className="w-20 px-3 py-2 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {lines.map((line, index) => (
            <tr key={`${line.name}-${index}`} className="hover:bg-surface/60">
              <td className="px-3 py-2 font-medium text-foreground">{line.name}</td>
              <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                {formatAmount(line.price)}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {formatAmount(line.amount)}
              </td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(index)}
                    aria-label={`Edit ${line.name}`}
                    className="press rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                  >
                    <Pencil size={15} strokeWidth={ICON_STROKE} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(index)}
                    aria-label={`Remove ${line.name}`}
                    className="press rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 size={15} strokeWidth={ICON_STROKE} aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
