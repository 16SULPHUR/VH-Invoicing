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
    printWindow.print();
  };

   return (
      <div className='absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4'>
        <div className='bg-white p-5 rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative'>
          <UpdatedVarietyHeavenInvoice
            invoiceId={invoice.id}
            invoiceDate={new Date(invoice.date).toLocaleDateString()}
            customerName={invoice.customerName}
            customerContact={invoice.customerNumber}
            products={JSON.parse(invoice.products)}
            calculateTotal={() => invoice.total}
            note={invoice.note}
          />

          <div className='fixed top-4 right-4 space-x-2'>
            <button 
              onClick={handlePrint} 
              className='bg-blue-500 text-white px-4 py-2 rounded'
            >
              Print Invoice
            </button>
            <button 
              onClick={handleEdit} 
              className='bg-yellow-500 text-white px-4 py-2 rounded'
            >
              Edit Invoice
            </button>
            <button 
              onClick={onClose} 
              className='bg-red-500 text-white px-4 py-2 rounded'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };