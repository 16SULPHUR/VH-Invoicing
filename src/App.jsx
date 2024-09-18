import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import PrintFriendlyInvoice from './PrintFriendlyInvoice';
import ReactDOMServer from 'react-dom/server';


const supabase = createClient(
  "https://basihmnebvsflzkaivds.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhc2lobW5lYnZzZmx6a2FpdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NDg4NDUsImV4cCI6MjA0MjIyNDg0NX0.9qX5k7Jin6T-TfZJt6YWSp0nWDypi4NkAwyhzerAC7U",
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

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("date", { ascending: false });
    if (error) console.error("Error fetching invoices:", error);
    else setInvoices(data || []);
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
    
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with leading 0 if needed
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed) and pad with 0
    const year = date.getFullYear(); // Get full year
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]; // Array for day names
    const weekDay = daysOfWeek[date.getDay()]; // Get the day of the week

    return `${day}/${month}/${year} ${weekDay}`;
}




  const handlePrint = async () => {
    // if (products.length === 0) {
    //   alert("Please add at least one product before printing the invoice.");
    //   return;
    // }

    const date =  getCurrentFormattedDate()

    const printContent = (
      <PrintFriendlyInvoice
        invoiceId={currentInvoiceId}
        invoiceDate={date}
        customerName={customerName}
        customerNumber={customerNumber}
        products={products}
        calculateTotal={calculateTotal}
      />
    );
  
    const printWindow = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
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
      date: currentDate.toISOString(),
      customerName,
      customerNumber,
      products,
      total: calculateTotal(),
    };

    const { data, error } = await supabase
      .from("invoices")
      .insert([newInvoice])
      .select();

    if (error) {
      console.error("Error saving invoice:", error);
    } else {
      console.log("Invoice saved successfully:", data);
      setCurrentInvoiceId(data[0].id);
      fetchInvoices();
    }

    // Clear the form after saving
    setProducts([]);
    setCustomerName("");
    setCustomerNumber("");
    setCurrentDate(new Date());
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

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "variety_heaven_invoices.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div
          className="col-md-3 border-end p-3"
          style={{ maxHeight: "600px", overflowY: "auto" }}
        >
          <h2 className="mb-4">Recent Invoices</h2>
          {invoices.map((invoice, index) => (
            <div key={invoice.id} className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Invoice #{invoice.id}</h5>
                <p className="card-text">
                  Date: {new Date(invoice.date).toLocaleDateString()}
                </p>
                <p className="card-text">
                  Customer: {invoice.customerName || "N/A"}
                </p>
                <p className="card-text">Total: ₹{invoice.total}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="col-md-9 p-3">
          <form className="mb-4">
            <div className="row">
              <div className="col-md-6 mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name (Optional)"
                />
              </div>
              <div className="col-md-6 mb-3">
                <input
                  type="tel"
                  className="form-control"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="Customer Number (Optional)"
                />
              </div>
            </div>
          </form>
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="row">
              <div className="col-md-3 mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Product Name"
                  required
                />
              </div>
              <div className="col-md-3 mb-3">
                <input
                  type="number"
                  className="form-control"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="Price"
                  step="0.01"
                  required
                />
              </div>
              <div className="col-md-3 mb-3">
                <input
                  type="number"
                  className="form-control"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  placeholder="Quantity"
                  required
                />
              </div>
              <div className="col-md-3 mb-3">
                <button type="submit" className="btn btn-primary w-100">
                  {editingProduct !== null ? "Update Product" : "Add Product"}
                </button>
                {editingProduct !== null && (
                  <button
                    type="button"
                    className="btn btn-secondary w-100 mt-2"
                    onClick={cancelEditing}
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </div>
          </form>
          <div ref={printAreaRef}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <img
                src="https://ik.imagekit.io/dqn1rnabh/logo-vh.png?updatedAt=1726645373505"
                alt="Variety Heaven Logo"
                style={{ width: "100px" }}
              />
              <div
                className="text-end seller-details"
                style={{ fontSize: "0.8rem", lineHeight: "1.2" }}
              >
                <h1 className="mb-1" style={{ fontSize: "1.5rem" }}>
                  VARIETY HEAVEN
                </h1>
                <p className="mb-0">
                  Shop no. 09, Sentosa Enclave, Near Ramipark soc.,
                </p>
                <p className="mb-0">Dindoli, Surat. PIN: 394-210</p>
                <p className="mb-0">Phone: 8160185875, 7990057097</p>
                <p className="mb-0">Email: supatil1975@gmail.com</p>
                <p className="mb-0">GSTIN: 24GGEPP0013E1ZZ</p>
              </div>
            </div>
            {(customerName || customerNumber) && (
              <div className="mb-4">
                <h3>Customer Information:</h3>
                {customerName && <p>Name: {customerName}</p>}
                {customerNumber && <p>Number: {customerNumber}</p>}
              </div>
            )}
            <h2 className="text-center mb-4">Invoice</h2>
            <table className="table table-bordered mb-4">
              <thead className="table-light">
                <tr>
                  <th>S.N.</th>
                  <th>Item name</th>
                  <th>Quantity</th>
                  <th>Price/Unit</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>₹{product.price.toFixed(2)}</td>
                    <td>₹{product.amount.toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => startEditing(index)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteProduct(index)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-end">
              <p className="fw-bold fs-5">Total Amount: ₹{calculateTotal()}</p>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handlePrint} className="btn btn-primary me-2">
              Print Bill
            </button>
            <button onClick={exportToCSV} className="btn btn-secondary">
              Export Invoices to CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VarietyHeavenBill;
