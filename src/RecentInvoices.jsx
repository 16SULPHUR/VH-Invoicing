import React, { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

const RecentInvoices = ({ recentInvoices, handleInvoiceClick, formatDate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredInvoiceId, setHoveredInvoiceId] = useState(null);
  // const [SheetCloseWrapper, shetCloseWrapperProps] = [
  //   SheetClose,
  //   { asChild: true },
  // ];

  const groupedInvoices = useMemo(() => {
    const groups = {};
    recentInvoices.forEach((invoice) => {
      const date = formatDate(invoice.date);
      if (!groups[date]) groups[date] = { invoices: [], totalSale: 0 };
      groups[date].invoices.push(invoice);
      groups[date].totalSale += invoice.total;
    });
    return groups;
  }, [recentInvoices, formatDate]);

  const renderPaymentIcons = (paymentMethods) => {
    return paymentMethods
      .map((paymentMethod) => {
        if (paymentMethod === "cash") return "💸";
        if (paymentMethod === "upi") return "🏛️";
        if (paymentMethod === "credit") return "❌";
        return "";
      })
      .join("");
  };

  const filteredAndGroupedInvoices = useMemo(() => {
    const filtered = recentInvoices.filter(invoice => 
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toString().includes(searchTerm) ||
      invoice.total.toString().includes(searchTerm)
    );

    const groups = {};
    filtered.forEach((invoice) => {
      const date = formatDate(invoice.date);
      if (!groups[date]) groups[date] = { invoices: [], totalSale: 0 };
      groups[date].invoices.push(invoice);
      groups[date].totalSale += invoice.total;
    });
    return groups;
  }, [recentInvoices, searchTerm, formatDate]);

  return (
    <Card className="w-full h-full bg-gray-900 border-0">
      <CardHeader>
      <Input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 text-white border-gray-700"
        />
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(90vh-4rem)] px-2 me-">
          {Object.entries(filteredAndGroupedInvoices).map(
            ([date, { invoices, totalSale }]) => (
              <div key={date} className="mb-4">
                <p className="text-md font-bold border-b border-gray-700 mb-2 text-pink-400">
                  {date}
                </p>
                {invoices.map((invoice) => {
                  const paymentMethods = [];
                  if (invoice.cash != null && invoice.cash !== 0)
                    paymentMethods.push("cash");
                  if (invoice.upi != null && invoice.upi !== 0)
                    paymentMethods.push("upi");
                  if (invoice.credit != null && invoice.credit !== 0)
                    paymentMethods.push("credit");

                  return (
                    // <SheetCloseWrapper
                    //   {...shetCloseWrapperProps}
                    //   key={invoice.id}
                    // >
                      <div
                        key={invoice.id}
                        className={`
                      ${
                        invoice.credit != 0
                          ? "bg-red-900/50 hover:bg-red-800"
                          : "bg-pink-900/50 hover:bg-gray-800"
                      }
                      mb-2 rounded-md shadow-md cursor-pointer px-2 py-1 text-md
                       transition-colors duration-200
                    `}
                        onClick={() => handleInvoiceClick(invoice.date)}
                        onMouseEnter={() => setHoveredInvoiceId(invoice.id)}
                        onMouseLeave={() => setHoveredInvoiceId(null)}
                      >
                        <div className="flex justify-between items-center">
                          <h6 className="font-bold text-gray-300">
                            #{invoice.id}
                          </h6>
                          <h6 className="font-bold text-gray-300">
                            {invoice.customerName.split(" ")[0]}
                          </h6>
                          <p className="text-md font-bold text-gray-900 bg-pink-400 rounded-md px-1">
                            {renderPaymentIcons(paymentMethods)} ₹{" "}
                            {invoice.total}
                          </p>
                        </div>
                        {paymentMethods.length > 1 &&
                          hoveredInvoiceId === invoice.id && (
                            <div className="flex gap-3 mt-2 transition-opacity duration-300 h-full">
                              {paymentMethods.map((paymentMethod) => (
                                <div
                                  key={paymentMethod}
                                  className="text-sm text-gray-300"
                                >
                                  <p className="text-md font-bold text-gray-900 bg-pink-400 rounded-md px-1">
                                    {paymentMethod === "cash"
                                      ? "💸"
                                      : paymentMethod === "upi"
                                      ? "🏛️"
                                      : "❌"}{" "}
                                    ₹ {invoice[paymentMethod]}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    // </SheetCloseWrapper>
                  );
                })}
                <div className="mt-2 text-right">
                  <p className="text-md font-bold text-pink-400">
                    Total Sale: ₹ {totalSale.toFixed(2)}
                  </p>
                </div>
              </div>
            )
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentInvoices;
