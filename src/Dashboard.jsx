import ReactDOMServer from "react-dom/server";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import LeftSidebar from "./LeftSideBar";
import MainContent from "./MainContent";
import RecentInvoices from "./RecentInvoices";
import { InvoiceModal } from "./InvoiceModal";
import { UpdatedVarietyHeavenInvoice } from "./PrintFriendlyInvoice";
import Sidebar from "./Sidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";

const supabase = createClient(
  "https://basihmnebvsflzkaivds.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhc2lobW5lYnZzZmx6a2FpdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NDg4NDUsImV4cCI6MjA0MjIyNDg0NX0.9qX5k7Jin6T-TfZJt6YWSp0nWDypi4NkAwyhzerAC7U"
);

const Dashboard = ({ setIsAuthenticated, setCurrentView }) => {
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [note, setNote] = useState("");
  const [dailySales, setDailySales] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const [credit, setCredit] = useState("");
  const [salesType, setSalesType] = useState("today"); // For dropdown selection
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  }); // For custom date range
  const [salesData, setSalesData] = useState([]); // Store the fetched sales
  const [cashSales, setCashSales] = useState("");
  const [upiSales, setUpiSales] = useState("");
  const [creditSales, setCreditSales] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const printAreaRef = useRef(null);

  // const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(false);
  // const [isRecentInvoicesExpanded, setIsRecentInvoicesExpanded] =
  //   useState(false);

  const [isLeftSidebarExpanded, setLeftSidebarExpanded] = useState(false);
  const [isRecentInvoicesExpanded, setRecentInvoicesExpanded] = useState(false);
  const [leftSidebarExpandedByClick, setLeftSidebarExpandedByClick] =
    useState(false);
  const [recentInvoicesExpandedByClick, setRecentInvoicesExpandedByClick] =
    useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError("Failed to sign in: " + error.message);
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      setError("");
    }
    setLoading(false);
  };

  const handleSalesTypeChange = (e) => {
    setSalesType(e.target.value);
    fetchSales(e.target.value);
  };

  const handleCustomDateChange = (e) => {
    const { name, value } = e.target;
    setCustomDateRange({ ...customDateRange, [name]: value });
  };

  const fetchSales = async (type) => {
    let startDate, endDate;
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    if (type === "today") {
      startDate = todayString + "T00:00:00";
      endDate = todayString + "T23:59:59"; // Include the whole day range
    } else if (type === "week") {
      startDate =
        new Date(today.setDate(today.getDate() - 7))
          .toISOString()
          .split("T")[0] + "T00:00:00";
      endDate = todayString + "T23:59:59"; // End date is today's end
    } else if (type === "month") {
      startDate =
        new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0] + "T00:00:00";
      endDate = todayString + "T23:59:59"; // End date is today's end
    } else if (type === "custom") {
      startDate = customDateRange.start + "T00:00:00"; // Include the start of the day
      endDate = customDateRange.end + "T23:59:59"; // Include the end of the day
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("date, total, cash, upi, credit")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
    } else {
      const totalSales = data.reduce(
        (acc, invoice) => acc + parseFloat(invoice.total),
        0
      );
      const totalCashSales = data.reduce(
        (acc, invoice) => acc + (parseFloat(invoice.cash) || 0),
        0
      );
      const totalUpiSales = data.reduce(
        (acc, invoice) => acc + (parseFloat(invoice.upi) || 0),
        0
      );
      const totalCreditSales = data.reduce(
        (acc, invoice) => acc + (parseFloat(invoice.credit) || 0),
        0
      );

      setSalesData(totalSales.toFixed(2)); // Display total sales
      setCashSales(totalCashSales.toFixed(2));
      setUpiSales(totalUpiSales.toFixed(2));
      setCreditSales(totalCreditSales.toFixed(2));
    }
  };

  useEffect(() => {
    fetchSales(salesType);
  }, [salesType]);

  const handleDoubleClick = (method) => {
    const totalAmount = calculateTotal();

    if (method === "cash") {
      setCash(totalAmount);
    } else if (method === "upi") {
      setUpi(totalAmount);
    } else if (method === "credit") {
      setCredit(totalAmount);
    }
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

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        throw error;
      }

      // Success message
      alert('Invoice deleted successfully');
      
      // Refresh all the necessary data
      fetchInvoices();
      fetchRecentInvoices();
      fetchDailySales();
      fetchSales(salesType);
      
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice: ' + error.message);
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
    setCash(invoice.cash);
    setUpi(invoice.upi);
    setCredit(invoice.credit);
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

  useEffect(() => {
    fetchInvoices();
    fetchRecentInvoices();
    fetchDailySales();
  }, []);

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
            total, // Format total
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
      .select()
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

  const deleteProduct = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  const calculateTotal = () => {
    console.log(products);
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

    if (
      total != cashAmount + upiAmount + creditAmount &&
      0 != cashAmount + upiAmount + creditAmount
    ) {
      alert("The total must be equal to the sum of Cash, UPI, and Credit.");
      return;
    }

    const date = getCurrentFormattedDate();

    const printContent = (
      <UpdatedVarietyHeavenInvoice
        invoiceId={currentInvoiceId}
        invoiceDate={new Date().toLocaleDateString()}
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
      // date: currentDate.toISOString(),
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

  // const toggleLeftSidebar = () =>
  //   setIsLeftSidebarExpanded(!isLeftSidebarExpanded);
  // const toggleRecentInvoices = () =>
  //   setIsRecentInvoicesExpanded(!isRecentInvoicesExpanded);

  const toggleLeftSidebar = () => {
    setLeftSidebarExpanded(!isLeftSidebarExpanded);
    setLeftSidebarExpandedByClick(!leftSidebarExpandedByClick); // Track toggle by button
  };

  const toggleRecentInvoices = () => {
    setRecentInvoicesExpanded(!isRecentInvoicesExpanded);
    setRecentInvoicesExpandedByClick(!recentInvoicesExpandedByClick); // Track toggle by button
  };

  const handleLeftMouseEnter = () => {
    if (!leftSidebarExpandedByClick) {
      setLeftSidebarExpanded(true);
    }
  };

  const handleLeftMouseLeave = () => {
    if (!leftSidebarExpandedByClick) {
      setLeftSidebarExpanded(false);
    }
  };

  const handleRightMouseEnter = () => {
    if (!recentInvoicesExpandedByClick) {
      setRecentInvoicesExpanded(true);
    }
  };

  const handleRightMouseLeave = () => {
    if (!recentInvoicesExpandedByClick) {
      setRecentInvoicesExpanded(false);
    }
  };

  return (
    <div
      id="dashboard"
      className="flex font-sans w-full h-full mx-auto bg-zinc-80 backdrop-blur-sm"
    >
      <div className="flex flex-1">
        <div
          className={`transition-all duration-300 ${
            isLeftSidebarExpanded ? "w-[400px]" : "w-[40px]"
          }`}
        >
          <div
            className="h-screen w-1 fixed"
            onClick={toggleLeftSidebar}
          ></div>
          <button
            onClick={toggleLeftSidebar}
            className="absolute bottom-4 left-4 z-10 bg-sky-500 text-white p-1 rounded-full"
          >
            {isLeftSidebarExpanded ? (
              <ChevronLeft size={24} />
            ) : (
              <ChevronRight size={24} />
            )}
          </button>
          {isLeftSidebarExpanded && (
            <div>
              <LeftSidebar
                dailySales={dailySales}
                salesType={salesType}
                salesData={salesData}
                cashSales={cashSales}
                upiSales={upiSales}
                creditSales={creditSales}
                handleSalesTypeChange={handleSalesTypeChange}
                customDateRange={customDateRange}
                handleCustomDateChange={handleCustomDateChange}
                fetchSales={fetchSales}
              />
            </div>
          )}
        </div>

        <MainContent
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerNumber={customerNumber}
          setCustomerNumber={setCustomerNumber}
          currentInvoiceId={currentInvoiceId}
          getCurrentFormattedDate={getCurrentFormattedDate}
          setCurrentDate={setCurrentDate}
          handleSubmit={handleSubmit}
          productName={productName}
          setProductName={setProductName}
          productQuantity={productQuantity}
          setProductQuantity={setProductQuantity}
          productPrice={productPrice}
          setProductPrice={setProductPrice}
          editingProduct={editingProduct}
          products={products}
          startEditing={startEditing}
          deleteProduct={deleteProduct}
          cash={cash}
          setCash={setCash}
          upi={upi}
          setUpi={setUpi}
          credit={credit}
          setCredit={setCredit}
          handleDoubleClick={handleDoubleClick}
          note={note}
          setNote={setNote}
          calculateTotal={calculateTotal}
          isEditing={isEditing}
          handleUpdateInvoice={handleUpdateInvoice}
          handlePrint={handlePrint}
        />

        <div
          className={`transition-all duration-300 ${
            isRecentInvoicesExpanded ? "w-[300px]" : "w-[40px]"
          }`}
        >
          <div
            className="h-screen w-1 fixed right-0"
            onClick={toggleRecentInvoices}
          ></div>
          <button
            onClick={toggleRecentInvoices}
            className="absolute bottom-4 right-4 z-10 bg-sky-500 text-white p-1 rounded-full"
          >
            {isRecentInvoicesExpanded ? (
              <ChevronRight size={24} />
            ) : (
              <ChevronLeft size={24} />
            )}
          </button>
          {isRecentInvoicesExpanded && (
            <div>
              <RecentInvoices
                recentInvoices={recentInvoices}
                handleInvoiceClick={handleInvoiceClick}
                formatDate={formatDate}
              />
            </div>
          )}
        </div>
      </div>

      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setShowInvoiceModal(false)}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
        />
      )}
    </div>
  );
};

export default Dashboard;
