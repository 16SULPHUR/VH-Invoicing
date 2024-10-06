import React from 'react';
import { UpdatedVarietyHeavenInvoice } from "./PrintFriendlyInvoice";
import ReactDOMServer from "react-dom/server";

export const InvoiceModal = ({ invoice, onClose, onEdit   }) => {
  if (!invoice) return null;

  console.log(invoice)
  // Ensure products is an array
  // const products = Array.isArray(invoice.products) ? JSON.parse(invoice.products) : [];


  const handleEdit = () => {
    onEdit(invoice);
    onClose();
  };
  
  const handlePrint = () => {
    const printContent = (
      <UpdatedVarietyHeavenInvoice
        invoiceId={invoice.id}
        invoiceDate={new Date(invoice.date).toLocaleDateString()}
        customerName={invoice.customerName}
        customerContact={invoice.customerNumber}
        products={JSON.parse(invoice.products)}
        calculateTotal={() => invoice.total}
        cash={invoice.cash}
      />
    );

    

    const printWindow = window.open(
      "",
      "",
      "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0"
    );
    printWindow.document.write(`
      <html>
        <head>
          <title>Variety Heaven Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${ReactDOMServer.renderToString(printContent)}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 1500);
  };

  return (
    <div 
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}
     className='absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4'>
      <div className='flex space-x-4'>
      <div className='flex flex-col space-y-2'>
          <div 
            className='bg-white text-blue-900 px-3 text-lg font-semibold py-2 rounded'
          >
            🧾 Total {invoice.total}
          </div>
          <div 
            className='bg-white text-blue-900 px-3 text-lg font-semibold py-2 rounded'
          >
            💸 Cash {invoice.cash}
          </div>
          <div 
            className='bg-white text-blue-900 px-3 text-lg font-semibold py-2 rounded'
          >
            🏛️ UPI {invoice.upi}
          </div>
          <div 
            className='bg-white text-blue-900 px-3 text-lg font-semibold py-2 rounded'
          >
            ❌ Credit {invoice.credit}
          </div>
        </div>

        {/* Invoice Section */}
        <div className='bg-white p-5 rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative'>
          <UpdatedVarietyHeavenInvoice
            invoiceId={invoice.id}
            invoiceDate={new Date(invoice.date).toLocaleDateString()}
            customerName={invoice.customerName}
            customerContact={invoice.customerNumber}
            products={JSON.parse(invoice.products)}
            calculateTotal={() => invoice.total}
            note={invoice.note}
            cash={invoice.cash}
          />
        </div>
  
        {/* Buttons Section */}
        <div className='flex flex-col space-y-2'>
          <button 
            onClick={onClose} 
            className='bg-red-500 text-white px-3 text-lg font-semibold py-2 rounded'
          >
            ❌ Close
          </button>
          <button 
            onClick={handlePrint} 
            className='bg-blue-500 text-white px-3 text-lg font-semibold py-2 rounded'
          >
            🖨️ Print
          </button>
          <button 
            onClick={handleEdit} 
            className='bg-yellow-500 text-white px-3 text-lg font-semibold py-2 rounded'
          >
            🖊️ Edit
          </button>
        </div>
      </div>
    </div>
  );
  


  };