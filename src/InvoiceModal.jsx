import React, { useState } from 'react';
import { UpdatedVarietyHeavenInvoice } from "./PrintFriendlyInvoice";
import ReactDOMServer from "react-dom/server";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const InvoiceModal = ({ invoice, onClose, onEdit, onDelete }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!invoice) return null;

  const handleEdit = () => {
    onEdit(invoice);
    onClose();
  };
  
  const handleDelete = () => {
    onDelete(invoice.id);
    setShowDeleteDialog(false);
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
    <>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      >
        <div className="flex space-x-4">
        <div className="flex flex-col space-y-1">
  <div className="bg-gray-800 text-sky-400 rounded p-2">
    <p className="text-sm font-medium">🧾 Total ₹{invoice.total}</p>
  </div>
  <div className="bg-gray-800 text-green-400 rounded p-2">
    <p className="text-sm font-medium">💸 Cash ₹{invoice.cash}</p>
  </div>
  <div className="bg-gray-800 text-blue-400 rounded p-2">
    <p className="text-sm font-medium">🏛️ UPI ₹{invoice.upi}</p>
  </div>
  <div className="bg-gray-800 text-red-400 rounded p-2">
    <p className="text-sm font-medium">❌ Credit ₹{invoice.credit}</p>
  </div>
</div>

          <div className="bg-white p-2 rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative">
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

          <div className="flex flex-col space-y-2">
            <Button variant="destructive" onClick={onClose}>
              ❌ Close
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              🖨️ Print
            </Button>
            <Button variant="default" onClick={handleEdit}>
              🖊️ Edit
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              🗑️ Delete
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This action cannot be undone. This will permanently delete the invoice
              for customer "{invoice.customerName}" with total amount ₹{invoice.total}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-gray-100 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};