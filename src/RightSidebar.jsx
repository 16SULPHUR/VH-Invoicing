import React, { useState, useEffect } from "react";
import { InvoiceModal } from "./InvoiceModal";
import { supabase } from "./supabaseClient";

const RightSidebar = ({setCurrentInvoiceId}) => {
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);


  useEffect(() => {
    fetchRecentInvoices();
  }, []);

  const fetchRecentInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, date, customerName, total")
      .order("date", { ascending: false });
    if (error) console.error("Error fetching recent invoices:", error);
    else setRecentInvoices(data || []);
  };

  function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}`;
  }

  const handleInvoiceClick = async (invoiceId) => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error) {
      console.error("Error fetching invoice details:", error);
    } else {
      setSelectedInvoice(data);
      setShowInvoiceModal(true);
    }
  };

  const handleEditInvoice = (invoice) => {
    setIsEditing(true);
    setCurrentInvoiceId(invoice.id);
    setCustomerName(invoice.customerName);
    setCustomerNumber(invoice.customerNumber);
    setCurrentDate(new Date(invoice.date));
    setProducts(JSON.parse(invoice.products));
    setNote(invoice.note);
    setShowInvoiceModal(false);
  };

  const setCurrentInvoiceId = () =>{
    setCurrentInvoiceId()
  }


  return (
    <div>
      <div className="w-[300px] h-[90vh] overflow-y-scroll p-3 text-pink-200 rounded-md border-l-4 border-indigo-500">
        <h3 className="text-lg font-bold text-pink-500 mb-2.5">Recent Invoices</h3>
        {recentInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-pink-950 mb-2.5 rounded-md shadow-md cursor-pointer flex justify-between items-center  px-2 text-md"
            onClick={() => handleInvoiceClick(invoice.id)}
          >
            <p className="text-md font-bold border-b">{formatDate(invoice.date)}</p>
            <h6 className="font-bold">{invoice.customerName}</h6>
            <p className="text-md font-bold text-black bg-white rounded-md px-1">₹ {invoice.total}</p>
          </div>
        ))}
      </div>

      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setShowInvoiceModal(false)}
          onEdit={handleEditInvoice}
        />
      )}
    </div>
  )
}

export default RightSidebar