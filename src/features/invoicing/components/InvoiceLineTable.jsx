import { formatAmount } from "@/utils/formatters";

const HEADERS = ["Item Name", "Quantity", "Price/Unit", "Amount", "Action"];
const cellClass = "border border-gray-700 p-2 text-sm font-semibold text-white md:text-base";

export function InvoiceLineTable({ lines, onEdit, onDelete }) {
  if (lines.length === 0) {
    return (
      <p className="mb-5 rounded-md border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
        No items yet. Scan a product or add one above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="mb-5 w-full border-collapse">
        <thead>
          <tr>
            {HEADERS.map((header) => (
              <th
                key={header}
                className="border border-pink-600 bg-pink-600 p-2 text-left text-white"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={`${line.name}-${index}`} className="bg-gray-800">
              <td className={cellClass}>{line.name}</td>
              <td className={cellClass}>{line.quantity}</td>
              <td className={cellClass}>₹ {formatAmount(line.price)}</td>
              <td className={cellClass}>₹ {formatAmount(line.amount)}</td>
              <td className={cellClass}>
                <button
                  type="button"
                  className="mr-2 rounded-md bg-pink-600 px-2 py-1 text-xs text-white transition-colors hover:bg-pink-700 md:text-sm"
                  onClick={() => onEdit(index)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-md bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600 md:text-sm"
                  onClick={() => onDelete(index)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
