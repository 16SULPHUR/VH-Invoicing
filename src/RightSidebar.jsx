import React from 'react'

const RightSidebar = () => {
  return (
    <div>
    <div className="w-[300px] h-[90vh] overflow-y-scroll p-3 text-sky-200 rounded-md border-l-4 border-indigo-500">
      <h3 className="text-lg font-bold text-sky-500 mb-2.5">Recent Invoices</h3>
      {recentInvoices.map((invoice) => (
        <div
          key={invoice.id}
          className="bg-blue-950 mb-2.5 rounded-md shadow-md cursor-pointer flex justify-between items-center  px-2 text-md"
          onClick={() => handleInvoiceClick(invoice.id)}
        >
          <p className="text-md font-bold border-b">{formatDate(invoice.date)}</p>
          <h6 className="font-bold">{invoice.customerName}</h6>
          <p className="text-md font-bold text-black bg-white rounded-md px-1">₹ {invoice.total}</p>
        </div>
      ))}
    </div></div>
  )
}

export default RightSidebar