import { PAYMENT_METHODS } from "../paymentMethods";

export function PaymentDetails({ payments, setPayment, onAssignFullAmount }) {
  return (
    <div className="mb-4 flex flex-col justify-around gap-4 md:flex-row">
      {PAYMENT_METHODS.map(({ key, label, icon }) => (
        <div key={key} className="w-full md:w-1/3">
          <label className="mb-1 block text-sm font-bold text-pink-500" htmlFor={key}>
            {label}:
          </label>
          <div className="flex items-center gap-3">
            <span
              className="cursor-pointer text-3xl"
              title={`Double-click to put the full amount in ${label}`}
              onDoubleClick={() => onAssignFullAmount(key)}
            >
              {icon}
            </span>
            <input
              className="w-full rounded-md border border-gray-600 bg-gray-800 p-2 text-white focus:border-pink-500 focus:outline-none"
              placeholder={label}
              type="number"
              id={key}
              value={payments[key]}
              onChange={(event) => setPayment(key, event.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
