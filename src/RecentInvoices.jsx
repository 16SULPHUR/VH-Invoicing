import React, { useState, useMemo } from "react";

const RecentInvoices = ({ recentInvoices, handleInvoiceClick, formatDate }) => {
  const [hoveredInvoiceId, setHoveredInvoiceId] = useState(null);

  const groupedInvoices = useMemo(() => {
    const groups = {};
    recentInvoices.forEach(invoice => {
      const date = formatDate(invoice.date);
      if (!groups[date]) groups[date] = { invoices: [], totalSale: 0 };
      groups[date].invoices.push(invoice);
      groups[date].totalSale += invoice.total;
    });
    return groups;
  }, [recentInvoices, formatDate]);

  const renderPaymentIcons = (paymentMethods) => {
    return paymentMethods.map(paymentMethod => {
      if (paymentMethod === "cash") return "💸";
      if (paymentMethod === "upi") return "🏛️";
      if (paymentMethod === "credit") return "❌";
      return "";
    }).join("");
  };

  return (
    <div className="w-[300px] h-[90vh] overflow-y-scroll p-3 text-sky-200 rounded-md">
      <h3 className="text-lg font-bold text-sky-500 mb-2.5">Recent Invoices</h3>
      {Object.entries(groupedInvoices).map(([date, { invoices, totalSale }]) => (
        <div key={date} className="mb-4">
          <p className="text-md font-bold border-b mb-2">{date}</p>
          {invoices.map((invoice) => {
            const paymentMethods = [];
            if (invoice.cash != null && invoice.cash !== 0) paymentMethods.push("cash");
            if (invoice.upi != null && invoice.upi !== 0) paymentMethods.push("upi");
            if (invoice.credit != null && invoice.credit !== 0) paymentMethods.push("credit");

            return (
              <div
                id="card"
                key={invoice.id}
                className={`
                  ${invoice.credit != 0 ? "bg-red-950" : "bg-blue-950"}
                  mb-2 rounded-md shadow-md cursor-pointer px-2 py-1 text-md
                `}
                onClick={() => handleInvoiceClick(invoice.id)}
                onMouseEnter={() => setHoveredInvoiceId(invoice.id)}
                onMouseLeave={() => setHoveredInvoiceId(null)}
              >
                <div className="flex justify-between items-center">
                  <h6 className="font-bold">#{invoice.id}</h6>
                  <h6 className="font-bold">{invoice.customerName.split(" ")[0]}</h6>
                  <p className="text-md font-bold text-black bg-white rounded-md px-1">
                    {renderPaymentIcons(paymentMethods)}
                    {" "}₹ {invoice.total}
                  </p>
                </div>
                {paymentMethods.length > 1 && hoveredInvoiceId === invoice.id && (
                  <div id="payment-methods" className="flex gap-3 mt-2 transition-opacity duration-300">
                    {paymentMethods.map((paymentMethod) => (
                      <div key={paymentMethod} className="text-sm text-white">
                        <p className="text-md font-bold text-black bg-white rounded-md px-1">
                          {paymentMethod === "cash" ? "💸" : paymentMethod === "upi" ? "🏛️" : "❌"}{" "}
                          ₹ {invoice[paymentMethod]}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-2 text-right">
            <p className="text-md font-bold text-sky-300">
              Total Sale: ₹ {totalSale.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentInvoices;