import React from 'react';
import { UpdatedVarietyHeavenInvoice } from "./PrintFriendlyInvoice";
import ReactDOMServer from "react-dom/server";

export const InvoiceModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  // Ensure products is an array
  // const products = Array.isArray(invoice.products) ? JSON.parse(invoice.products) : [];

  console.log(JSON.parse(invoice.products))
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '80%',
        maxHeight: '80%',
        overflow: 'auto'
      }}>
        <UpdatedVarietyHeavenInvoice
          invoiceId={invoice.id}
          invoiceDate={new Date(invoice.date).toLocaleDateString()}
          customerName={invoice.customerName}
          customerContact={invoice.customerNumber}
          products={JSON.parse(invoice.products)}
          calculateTotal={() => invoice.total}
        />
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button onClick={handlePrint} style={{ marginRight: '10px' }}>Print Invoice</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};