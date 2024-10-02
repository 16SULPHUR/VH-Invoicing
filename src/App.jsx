import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { UpdatedVarietyHeavenInvoice } from "./PrintFriendlyInvoice";
import { InvoiceModal } from "./InvoiceModal";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  const [dailySales, setDailySales] = useState([]);

  function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
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
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchRecentInvoices();
    fetchDailySales();
  }, []);

  const fetchDailySales = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("date, total")
      .order("date", { ascending: false })
      .limit(30); // Fetch last 30 days of sales

    if (error) {
      console.error("Error fetching daily sales:", error);
    } else {
      const salesByDate = data.reduce((acc, invoice) => {
        const date = new Date(invoice.date).toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + parseFloat(invoice.total);
        return acc;
      }, {});

      const salesArray = Object.entries(salesByDate)
        .map(([date, total]) => {
          const d = new Date(date);

          return {
            date,
            total,
            formattedDate: String(d.getDate()).padStart(2, "0"),
          };
        })
        .reverse(); // Reverse to show oldest date first in the graph

      setDailySales(salesArray);
    }
  };

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
    console.log(products)
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
      note,
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

  const addProduct = () => {
    // Check if the inputs are valid (e.g., all fields are filled)
    if (!productName || productQuantity <= 0 || productPrice <= 0) {
      alert("Please enter valid product details.");
      return;
    }
  
    // Create a new product object
    const newProduct = {
      name: productName,
      quantity: parseInt(productQuantity, 10), // Convert quantity to integer
      price: parseFloat(productPrice), // Convert price to float
    };
  
    // Add the new product to the products list
    setProducts([...products, newProduct]);
  
    // Reset input fields after adding the product
    setProductName("");
    setProductQuantity("");
    setProductPrice("");
  };

  

  return (
    <div className="flex gap-10 font-sans max-w-[1400px] mx-auto my-2">
      {/* Left Sidebar: Daily Sales */}
      <div className="w-[300px] h-[90vh] overflow-y-scroll bg-gray-100 rounded-md p-5">
        <h3 className="text-lg font-bold mb-2.5">Daily Sales</h3>
        <div className="mb-5 bg-white p-2.5 rounded-md shadow-md">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailySales}>
              <XAxis
                dataKey="formattedDate"
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
  
      {/* Main Content: Invoice Form */}
      <div className="flex-grow">
        <h5 className="text-center font-bold bg-green-100 border border-black p-1.5">
          Create Invoice
        </h5>
  
        <form className="mb-5" onSubmit={handleSubmit}>
          {/* Customer Details */}
          <div className="flex justify-between mb-4">
            <div className="w-[48%]">
              <label className="block mb-1 font-bold text-sm" htmlFor="customerName">
                Customer Name:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="text"
                id="customerName"
                placeholder="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="w-[48%]">
              <label className="block mb-1 font-bold text-sm" htmlFor="customerNumber">
                Customer Number:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="text"
                id="customerNumber"
                placeholder="customerNumber"
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
              />
            </div>
          </div>
  
          {/* Invoice Details */}
          <div className="flex justify-between mb-4">
            <div className="w-[48%]">
              <label className="block mb-1 font-bold text-sm" htmlFor="invoiceId">
                Invoice No:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                type="text"
                id="invoiceId"
                value={currentInvoiceId}
                readOnly
              />
            </div>
            <div className="w-[48%]">
              <label className="block mb-1 font-bold text-sm" htmlFor="invoiceDate">
                Date:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="text"
                id="invoiceDate"
                value={getCurrentFormattedDate()}
                onChange={(e) => setCurrentDate(e.target.value)}
              />
            </div>
          </div>
        </form>
  
        {/* Product Table with Inputs */}
        <h5 className="text-lg font-semibold mb-2">
          {editingProduct !== null ? "Edit Product" : "Add Product"}
        </h5>
        <table className="w-full border-collapse mb-5">
          <thead>
            <tr>
              <th className="bg-green-100 border border-black p-2.5 text-left">Item Name</th>
              <th className="bg-green-100 border border-black p-2.5 text-left">Quantity</th>
              <th className="bg-green-100 border border-black p-2.5 text-left">Price/Unit</th>
              <th className="bg-green-100 border border-black p-2.5 text-left">Amount</th>
              <th className="bg-green-100 border border-black p-2.5 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td className="border border-black p-2.5">
                  <input
                    className="w-full p-2 border border-gray-300 rounded-md"
                    type="text"
                    value={product.name}
                    onChange={(e) => updateProductField(index, 'name', e.target.value)}
                  />
                </td>
                <td className="border border-black p-2.5">
                  <input
                    className="w-full p-2 border border-gray-300 rounded-md"
                    type="number"
                    value={product.quantity}
                    onChange={(e) => updateProductField(index, 'quantity', e.target.value)}
                  />
                </td>
                <td className="border border-black p-2.5">
                  <input
                    className="w-full p-2 border border-gray-300 rounded-md"
                    type="number"
                    value={product.price}
                    onChange={(e) => updateProductField(index, 'price', e.target.value)}
                  />
                </td>
                <td className="border border-black p-2.5">
                  ₹ {(product.quantity * product.price).toFixed(2)}
                </td>
                <td className="border border-black p-2.5">
                  <button
                    onClick={() => deleteProduct(index)}
                    className="bg-red-500 text-white px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {/* Add New Product Row */}
            <tr>
              <td className="border border-black p-2.5">
                <input
                  className="w-full p-2 border border-gray-300 rounded-md"
                  type="text"
                  placeholder="Item Name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </td>
              <td className="border border-black p-2.5">
                <input
                  className="w-full p-2 border border-gray-300 rounded-md"
                  type="number"
                  placeholder="Quantity"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                />
              </td>
              <td className="border border-black p-2.5">
                <input
                  className="w-full p-2 border border-gray-300 rounded-md"
                  type="number"
                  placeholder="Price/Unit"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                />
              </td>
              <td className="border border-black p-2.5">₹ {(productQuantity * productPrice).toFixed(2)}</td>
              <td className="border border-black p-2.5">
                <button
                  onClick={addProduct}
                  className="bg-green-500/[.7] text-white p-2 rounded-md cursor-pointer"
                >
                  ➕
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan="3"
                className="border border-black p-2.5 text-right font-bold"
              >
                Total:
              </td>
              <td className="border border-black p-2.5 font-bold">
                ₹ {calculateTotal()}
              </td>
              <td className="border border-black p-2.5"></td>
            </tr>
          </tfoot>
        </table>
  
        {/* Note Field */}
        <div className="mb-4">
          <label className="block mb-1 font-bold text-sm" htmlFor="note">
            Note:
          </label>
          <input
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="NOTE"
            type="text"
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
  
        {/* Generate Invoice Button */}
        <div className="mt-5 text-right">
          <button
            onClick={handlePrint}
            className="bg-green-500 text-white px-4 py-2 rounded-md cursor-pointer"
          >
            Generate Invoice
          </button>
        </div>
      </div>
  
      {/* Right Sidebar: Recent Invoices */}
      <div className="w-[300px] h-[90vh] overflow-y-scroll bg-gray-100 p-5 rounded-md">
        <h3 className="text-lg font-bold mb-2.5">Recent Invoices</h3>
        {recentInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-white p-2.5 mb-2.5 rounded-md shadow-md cursor-pointer"
            onClick={() => handleInvoiceClick(invoice.id)}
          >
            <h5 className="font-bold">{invoice.customerName}</h5>
            <p className="text-sm">{invoice.invoiceId}</p>
            <p className="text-sm">₹ {invoice.total}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VarietyHeavenBill;
