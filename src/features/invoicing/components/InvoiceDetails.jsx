import { formatInvoiceHeaderDate } from "@/utils/date";

const fieldClass =
  "w-full rounded-md border border-gray-600 p-2 text-white focus:border-pink-500 focus:outline-none";

export function InvoiceDetails({ invoiceId, currentDate }) {
  return (
    <div className="mb-4 flex w-full flex-col justify-between gap-4 md:flex-row">
      <div className="w-full md:w-[48%]">
        <label className="mb-1 block text-sm font-bold text-pink-500" htmlFor="invoiceId">
          Invoice No:
        </label>
        <input
          className={`${fieldClass} bg-gray-700`}
          type="text"
          id="invoiceId"
          value={invoiceId ?? ""}
          readOnly
        />
      </div>
      <div className="w-full md:w-[48%]">
        <label className="mb-1 block text-sm font-bold text-pink-500" htmlFor="invoiceDate">
          Date:
        </label>
        <input
          className={`${fieldClass} bg-gray-800`}
          type="text"
          id="invoiceDate"
          value={formatInvoiceHeaderDate(currentDate)}
          readOnly
        />
      </div>
    </div>
  );
}
