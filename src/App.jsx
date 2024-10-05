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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const [credit, setCredit] = useState("");


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

  const handleUpdateInvoice = async () => {

    const total = calculateTotal();
    const cashAmount = parseFloat(cash) || 0;
    const upiAmount = parseFloat(upi) || 0;
    const creditAmount = parseFloat(credit) || 0;

    if (total != cashAmount + upiAmount + creditAmount) {
      alert("The total must be equal to the sum of Cash, UPI, and Credit.");
      return;
    }


    const updatedInvoice = {
      customerName,
      customerNumber,
      date: currentDate.toISOString(),
      products: JSON.stringify(products),
      total: calculateTotal(),
      cash: parseFloat(cash) || 0,
      upi: parseFloat(upi) || 0,
      credit: parseFloat(credit) || 0,
      note,
    };

    const { data, error } = await supabase
      .from("invoices")
      .update(updatedInvoice)
      .eq("id", currentInvoiceId);

    if (error) {
      console.error("Error updating invoice:", error);
    } else {
      console.log("Invoice updated successfully:", data);
      setIsEditing(false);
      fetchInvoices();
      fetchRecentInvoices();
      fetchDailySales();

      // Clear the form after updating
      setProducts([]);
      setCustomerName("");
      setCustomerNumber("");
      setCurrentDate(new Date());
      setCash("");
      setUpi("");
      setCredit("");
      setNote("");
    }
  };


  const closeModal = () => {
    setShowInvoiceModal(false);
  };

  useEffect(() => {
    fetchInvoices();
    fetchRecentInvoices();
    fetchDailySales();
  }, []);

  const formatPrice = (price) => {
    if (price >= 1_000_000) {
      return (price / 1_000_000).toFixed(1) + 'M';
    } else if (price >= 1_000) {
      return (price / 1_000).toFixed(1) + 'k';
    } else {
      return price.toFixed(2);  // Default to two decimal places for small values
    }
  };






  const fetchDailySales = async () => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7); // Calculate the date 7 days ago

    const { data, error } = await supabase
      .from("invoices")
      .select("date, total")
      .gte("date", last7Days.toISOString().split("T")[0]) // Filter by date greater than or equal to 7 days ago
      .order("date", { ascending: false }); // Fetch the last 7 days of sales, ordered by date

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
            total,  // Format total
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

    const total = calculateTotal();
    const cashAmount = parseFloat(cash) || 0;
    const upiAmount = parseFloat(upi) || 0;
    const creditAmount = parseFloat(credit) || 0;

    if (total != cashAmount + upiAmount + creditAmount) {
      alert("The total must be equal to the sum of Cash, UPI, and Credit.");
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
    setTimeout(() => {
      printWindow.print();
    }, 1500);

    const newInvoice = {
      date: currentDate.toISOString(),
      customerName,
      customerNumber,
      products: JSON.stringify(products),
      total: calculateTotal(),
      cash: parseFloat(cash) || 0,
      upi: parseFloat(upi) || 0,
      credit: parseFloat(credit) || 0,
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
      setCurrentInvoiceId((prev) => prev + 1);
      fetchInvoices();
      fetchRecentInvoices();
      fetchDailySales();
    }

    // Clear the form after saving
    setProducts([]);
    setCustomerName("");
    setCustomerNumber("");
    setCurrentDate(new Date());
    setCash("");
    setUpi("");
    setCredit("");
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
    <div className="flex gap-10 font-sans w-full h-full mx-auto py-12 bg-zinc-800 ">
      {/* Left Sidebar: Daily Sales */}
      <div className="w-[450px] h-[90vh] overflow-y-scroll rounded-md p-5 border-r-4 border-indigo-500">
        <h3 className="text-lg font-bold text-sky-500 mb-2.5">Daily Sales</h3>
        <div className="mb-5 bg-white rounded-md shadow-md">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailySales}>
              <XAxis
                dataKey="formattedDate"
                angle={0}
                textAnchor="end"
                height={30}
              />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#38b6ff" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content: Invoice Form */}
      <div className="flex-grow">
        <h5 className="text-center font-bold bg-sky-500 text-white border border-black p-1.5">
          Create Invoice
        </h5>

        <form onSubmit={handleSubmit}>
          {/* Customer Details */}
          <div className="flex justify-between mb-4">
            <div className="w-[48%]">
              <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="customerName">
                Customer Name:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="text"
                id="customerName"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="w-[48%]">
              <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="customerNumber">
                Customer Number:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="text"
                id="customerNumber"
                placeholder="Customer Number"
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Invoice Details */}
          <div className="flex justify-between mb-4">
            <div className="w-[48%]">
              <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="invoiceId">
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
              <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="invoiceDate">
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

        {/* Product Input Form */}
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between mb-4">
            <div className="w-[48%]">
              <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="productName">
                Product Name:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="text"
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div className="w-[24%]">
              <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="productQuantity">
                Quantity:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="number"
                id="productQuantity"
                value={productQuantity}
                onChange={(e) => setProductQuantity(e.target.value)}
              />
            </div>
            <div className="w-[24%]">
              <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="productPrice">
                Price/Unit:
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="number"
                id="productPrice"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="text-right">
            <button
              type="submit"
              className="bg-sky-500 text-white px-4 py-2 rounded-md cursor-pointer"
            >
              {editingProduct !== null ? "Update Product" : "Add Product"}
            </button>
          </div>

        </form>

        {/* Product Table with Inputs */}
        <h5 className="text-lg font-semibold mb-2 text-sky-500">
          {editingProduct !== null ? "Edit Product" : "Add Product"}
        </h5>

        {/* Product Table */}
        <table className="w-full border-collapse mb-5">
          <thead>
            <tr>
              <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Item Name</th>
              <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Quantity</th>
              <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Price/Unit</th>
              <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Amount</th>
              <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td className="border border-white text-white font-semibold text-lg p-2.5">{product.name}</td>
                <td className="border border-white text-white font-semibold text-lg p-2.5">{product.quantity}</td>
                <td className="border border-white text-white font-semibold text-lg p-2.5">₹ {product.price.toFixed(2)}</td>
                <td className="border border-white text-white font-semibold text-lg p-2.5">₹ {product.amount.toFixed(2)}</td>
                <td className="border border-white text-white font-semibold text-lg p-2.5">
                  <button
                    className="bg-sky-500 text-white px-2 py-1 rounded-md mr-2"
                    onClick={() => startEditing(index)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded-md"
                    onClick={() => deleteProduct(index)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right font-bold text-sky-500">
          Total: ₹ {calculateTotal()}
        </div>

        {/* Note Field */}
        <div>



          <div className="flex justify-around">
            <div className="mb-4">
              <label className="block mb-1 font-bold text-sky-500 text-sm ps-5" htmlFor="cash">
                Cash:
              </label>
              <div className="flex gap-3">
                <span className="text-3xl">💸</span>
                <input
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Cash"
                  type="number"
                  id="cash"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-bold text-sky-500 text-sm ps-5" htmlFor="upi">
                UPI:
              </label>
              <div className="flex gap-3">
                <span className="text-3xl">🏛️</span>
                <input
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="UPI"
                  type="number"
                  id="upi"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-bold text-sky-500 text-sm ps-5" htmlFor="credit">
                Credit:
              </label>
              <div className="flex gap-3">
                <span className="text-3xl">❌</span>
                <input
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Credit"
                  type="number"
                  id="credit"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="note">
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
        </div>

        {/* Generate Invoice Button */}
        <div className="mt-5 text-right">
          <button
            type="button"
            className={`bg-${isEditing ? 'yellow' : 'sky'}-500 text-white px-4 py-2 rounded-md cursor-pointer`}
            onClick={isEditing ? handleUpdateInvoice : handlePrint}
          >
            {isEditing ? 'Update Invoice' : 'Generate Invoice'}
          </button>
        </div>
      </div>

      {/* Right Sidebar: Recent Invoices */}
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
      </div>

      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setShowInvoiceModal(false)}
          onEdit={handleEditInvoice}
        />
      )}
    </div>
  );

}

export default VarietyHeavenBill;
