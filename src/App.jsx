import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { UpdatedVarietyHeavenInvoice } from "./PrintFriendlyInvoice";
import {InvoiceModal} from "./InvoiceModal"

import ReactDOMServer from "react-dom/server";

const supabase = createClient(
  "https://basihmnebvsflzkaivds.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhc2lobW5lYnZzZmx6a2FpdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NDg4NDUsImV4cCI6MjA0MjIyNDg0NX0.9qX5k7Jin6T-TfZJt6YWSp0nWDypi4NkAwyhzerAC7U"
);

const VarietyHeavenBill = () => {
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const printAreaRef = useRef(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [note, setNote] = useState("");

  function formatDate(date){
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
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
    }
  };

  useEffect(() => {
    fetchInvoices();
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

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("date", { ascending: false });
    if (error) console.error("Error fetching invoices:", error);
    else {
      setInvoices(data || []);
      setCurrentInvoiceId(data[0].id + 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (productName && productPrice && productQuantity) {
      const newProduct = {
        name: productName,
        price: parseFloat(productPrice),
        quantity: parseInt(productQuantity),
        amount: parseFloat(productPrice) * parseInt(productQuantity),
      };

      if (editingProduct !== null) {
        // Update existing product
        const updatedProducts = [...products];
        updatedProducts[editingProduct] = newProduct;
        setProducts(updatedProducts);
        setEditingProduct(null);
      } else {
        // Add new product
        setProducts([...products, newProduct]);
      }

      setProductName("");
      setProductPrice("");
      setProductQuantity("");
    }
  };

  const startEditing = (index) => {
    const productToEdit = products[index];
    setProductName(productToEdit.name);
    setProductPrice(productToEdit.price.toString());
    setProductQuantity(productToEdit.quantity.toString());
    setEditingProduct(index);
  };

  const cancelEditing = () => {
    setProductName("");
    setProductPrice("");
    setProductQuantity("");
    setEditingProduct(null);
  };

  const deleteProduct = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  const calculateTotal = () => {
    return products
      .reduce((sum, product) => sum + product.amount, 0)
      .toFixed(2);
  };

  function getCurrentFormattedDate() {
    const date = new Date();

    const day = String(date.getDate()).padStart(2, "0"); // Get day and pad with leading 0 if needed
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Get month (0-indexed) and pad with 0
    const year = date.getFullYear(); // Get full year
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]; // Array for day names
    const weekDay = daysOfWeek[date.getDay()]; // Get the day of the week

    return `${day}/${month}/${year} ${weekDay}`;
  }

  const handlePrint = async () => {
    if (products.length === 0) {
      alert("Please add at least one product before printing the invoice.");
      return;
    }

    const date = getCurrentFormattedDate();

    const printContent = (
      <UpdatedVarietyHeavenInvoice
        invoiceId={currentInvoiceId}
        invoiceDate={currentDate}
        customerName={customerName}
        customerContact={customerNumber}
        products={products}
        calculateTotal={calculateTotal}
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
          <title>Variety Heaven Bill</title>
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

    const newInvoice = {
      date: currentDate,
      customerName,
      customerNumber,
      products,
      total: calculateTotal(),
      note
    };

    const { data, error } = await supabase
      .from("invoices")
      .insert([newInvoice])
      .select();

    if (error) {
      console.error("Error saving invoice:", error);
    } else {
      console.log("Invoice saved successfully:", data);
      // setCurrentInvoiceId(data[0].id);
      fetchInvoices();
    }

    // Clear the form after saving
    setProducts([]);
    setCustomerName("");
    setCustomerNumber("");
    setCurrentDate(new Date());
    setNote("");
  };

  const exportToCSV = async () => {
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*");

    if (error) {
      console.error("Error fetching invoices:", error);
      alert("An error occurred while exporting invoices.");
      return;
    }

    if (invoices.length === 0) {
      alert("No invoices to export.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Invoice Number,Date,Customer Name,Customer Number,Total Amount,Products\n";

    invoices.forEach((invoice, index) => {
      const productsList = invoice.products
        .map((p) => `${p.name} (${p.quantity} x ₹${p.price})`)
        .join("; ");
      const row = [
        index + 1,
        invoice.date,
        invoice.customerName || "N/A",
        invoice.customerNumber || "N/A",
        invoice.total,
        productsList,
      ]
        .map((e) => `"${e}"`)
        .join(",");
      csvContent += row + "\n";
    });

    const startEditing = (index) => {
      const productToEdit = products[index];
      setProductName(productToEdit.name);
      setProductPrice(productToEdit.price.toString());
      setProductQuantity(productToEdit.quantity.toString());
      setEditingProduct(index);
    };

    const cancelEditing = () => {
      setProductName("");
      setProductPrice("");
      setProductQuantity("");
      setEditingProduct(null);
    };

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "variety_heaven_invoices.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      display: "flex",
      maxWidth: "1200px",
      margin: "auto",
      padding: "20px",
      gap:"20px"
    },
    mainContent: {
      flex: "1",
      marginRight: "20px",
    },
    sidebar: {
      width: "300px",
      height: "90vh",
      "overflow-y":"scroll",
      backgroundColor: "#f0f0f0",
      padding: "20px",
      borderRadius: "4px",
    },
    sidebarTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "10px",
    },
    invoiceItem: {
      backgroundColor: "white",
      padding: "10px",
      marginBottom: "10px",
      borderRadius: "4px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
    },
    invoiceItemTitle: {
      fontWeight: "bold",
      marginBottom: "5px",
    },

    // container: {
    //   fontFamily: "Arial, sans-serif",
    //   maxWidth: "800px",
    //   margin: "auto",
    //   padding: "20px",
    // },
    editButton: {
      backgroundColor: "#FFA500",
      color: "white",
      padding: "5px 10px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginRight: "5px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "20px",
      borderBottom: "1px solid #000",
      paddingBottom: "10px",
    },
    logo: {
      width: "100px",
    },
    companyDetails: {
      fontSize: "14px",
      lineHeight: "1.4",
    },
    form: {
      marginBottom: "20px",
    },
    formGroup: {
      marginBottom: "15px",
    },
    label: {
      display: "block",
      marginBottom: "5px",
      fontWeight: "bold",
      fontSize: "15px",
    },
    input: {
      width: "100%",
      padding: "8px",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "20px",
    },
    th: {
      backgroundColor: "#e8f5e9",
      border: "1px solid #000",
      padding: "10px",
      textAlign: "left",
    },
    td: {
      border: "1px solid #000",
      padding: "10px",
    },
    button: {
      backgroundColor: "#4CAF50",
      color: "white",
      padding: "10px 15px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginRight: "10px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Recent Invoices</h3>
        {recentInvoices.map((invoice) => (
          <div 
            key={invoice.id} 
            style={{...styles.invoiceItem, cursor: 'pointer'}}
            onClick={() => handleInvoiceClick(invoice.id)}
          >
            <div style={styles.invoiceItemTitle}>#{invoice.id} {invoice.customerName}</div>
            <div>Date: {formatDate(new Date(invoice.date).toLocaleDateString())}</div>
            <div>Total: ₹{invoice.total}</div>
          </div>
        ))}
      </div>
      <div style={styles.mainContent}>
        <h2
          style={{
            textAlign: "center",
            backgroundColor: "#e8f5e9",
            border: "1px solid #000",
            padding: "5px",
          }}
        >
          Tax Invoice
        </h2>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ width: "48%" }}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="customerName">
                  Customer Name:
                </label>
                <input
                  style={styles.input}
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="customerNumber">
                  Customer Number:
                </label>
                <input
                  style={styles.input}
                  type="text"
                  id="customerNumber"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                />
              </div>
            </div>
            <div style={{ width: "48%" }}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="invoiceId">
                  Invoice No:
                </label>
                <input
                  style={styles.input}
                  type="text"
                  id="invoiceId"
                  value={currentInvoiceId}
                  readOnly
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="invoiceDate">
                  Date:
                </label>
                <input
                  style={styles.input}
                  type="text"
                  id="invoiceDate"
                  value={getCurrentFormattedDate()}
                  onChange={(e) => setCurrentDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <h5>{editingProduct !== null ? "Edit Product" : "Add Product"}</h5>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ width: "30%" }}>
              <label style={styles.label} htmlFor="productName">
                Item name:
              </label>
              <input
                style={styles.input}
                type="text"
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div style={{ width: "30%" }}>
              <label style={styles.label} htmlFor="productQuantity">
                Quantity:
              </label>
              <input
                style={styles.input}
                type="number"
                id="productQuantity"
                value={productQuantity}
                onChange={(e) => setProductQuantity(e.target.value)}
              />
            </div>
            <div style={{ width: "30%" }}>
              <label style={styles.label} htmlFor="productPrice">
                Price/Unit:
              </label>
              <input
                style={styles.input}
                type="number"
                id="productPrice"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
              />
            </div>
          </div>
          <button style={{ ...styles.button, marginTop: "10px" }} type="submit">
            {editingProduct !== null ? "Update Product" : "Add Product"}
          </button>
          {editingProduct !== null && (
            <button
              style={{
                ...styles.button,
                marginTop: "10px",
                marginLeft: "10px",
                backgroundColor: "#ccc",
              }}
              type="button"
              onClick={cancelEditing}
            >
              Cancel
            </button>
          )}
        </form>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>S.N.</th>
              <th style={styles.th}>Item name</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Price/Unit</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{product.name}</td>
                <td style={styles.td}>{product.quantity}</td>
                <td style={styles.td}>₹ {product.price.toFixed(2)}</td>
                <td style={styles.td}>₹ {product.amount.toFixed(2)}</td>
                <td style={styles.td}>
                  <button
                    onClick={() => startEditing(index)}
                    style={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(index)}
                    style={{ ...styles.button, backgroundColor: "red" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan="4"
                style={{ ...styles.td, textAlign: "right", fontWeight: "bold" }}
              >
                Total:
              </td>
              <td style={{ ...styles.td, fontWeight: "bold" }}>
                ₹ {calculateTotal()}
              </td>
              <td style={styles.td}></td>
            </tr>
          </tfoot>
        </table>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="note">
            Note:
          </label>
          <input
            style={styles.input}
            placeholder="NOTE"
            type="text"
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button onClick={handlePrint} style={styles.button}>
            Generate Invoice
          </button>
        </div>
      </div>
        {selectedInvoice && (
          <InvoiceModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
          />
        )}
      </div>
  );
};

export default VarietyHeavenBill;
