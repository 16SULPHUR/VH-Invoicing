import ReactDOMServer from "react-dom/server";
import { supabase } from "./supabaseClient";
import React, { useState, useEffect, useRef } from "react";
import LeftSidebar from "./LeftSideBar";
import MainContent from "./MainContent";
import RecentInvoices from "./RecentInvoices";
import { InvoiceModal } from "./InvoiceModal";
import { UpdatedVarietyHeavenInvoice } from "./PrintFriendlyInvoice";
import { Button } from "@/components/ui/button";
import InvoiceForm from "./InvoiceForm";
import SalesChart from "./SalesChart";
import Sidebar from "./Sidebar";
import {
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  ChartNoAxesCombined,
  Menu,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import BarcodeScanner from "./BarcodeScanner";
import { useToast } from "@/hooks/use-toast";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const Dashboard = ({ setIsAuthenticated, setCurrentView }) => {
  const [customers, setCustomers] = useState([]);
  const [allproducts, setAllProducts] = useState([]);
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
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const printAreaRef = useRef(null);

  const [SheetCloseWrapper, shetCloseWrapperProps] = [
    SheetClose,
    { asChild: true },
  ];

  const { toast } = useToast();

  const [selectedFinancialYear, setSelectedFinancialYear] = useState(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    // If current month is before April (0-3), use previous year
    return currentMonth < 3
      ? `${currentYear - 1}-${currentYear}`
      : `${currentYear}-${currentYear + 1}`;
  });

  const getFinancialYearOptions = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const years = [];
    // Generate last 5 financial years
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  // Add this function to handle financial year change
  const handleFinancialYearChange = async (e) => {
    const yearRange = e.target.value;
    setSelectedFinancialYear(yearRange);

    const [startYear, endYear] = yearRange.split("-");
    const startDate = `${startYear}-04-01`; // Financial year starts from April 1st
    const endDate = `${endYear}-03-31T23:59:59`; // Financial year ends on March 31st

    // Fetch invoices for selected financial year
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

      console.log(data)

    if (error) {
      console.error("Error fetching invoices:", error);
    } else {
      setRecentInvoices(data || []);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select();

      if (customersError)
        console.error("Error fetching customers:", customersError);
      else setCustomers(customersData);
    };

    fetchData();
  }, []);

  // const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(false);
  // const [isRecentInvoicesExpanded, setIsRecentInvoicesExpanded] =
  //   useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, quantity, sellingPrice, supplier, barcode");

      if (productsError)
        console.error("Error fetching products:", productsError);
      else setAllProducts(productsData);
    };

    fetchData();
  }, []);

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

  const handleInvoiceClick = async (invoiceDate) => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("date", invoiceDate)
      .single();

    if (error) {
      console.error("Error fetching invoice details:", error);
    } else {
      setSelectedInvoice(data);
      setShowInvoiceModal(true);
    }
  };

  const handleDeleteInvoice = async (invoiceDate) => {
    try {
      const { data: invoice, error: fetchError } = await supabase
        .from("invoices")
        .select("*")
        .eq("date", invoiceDate)
        .single();

      if (fetchError) throw fetchError;

      const products = JSON.parse(invoice.products);

      // Restore stock for each product in the invoice
      for (const product of products) {
        const { data: existingProduct, error: fetchProductError } =
          await supabase
            .from("products")
            .select("quantity")
            .ilike("name", product.name)
            .single();

        if (fetchProductError) throw fetchProductError;

        const newQuantity = existingProduct.quantity + product.quantity;

        const { error: updateError } = await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .ilike("name", product.name);

        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("date", invoiceDate);

      if (error) throw error;

      // Success message
      alert("Invoice deleted successfully");

      // Refresh all the necessary data
      fetchInvoices();
      fetchRecentInvoices();
      fetchDailySales();
      fetchSales(salesType);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice: " + error.message);
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

    console.log("currentDate", currentDate);
    const { data, error } = await supabase
      .from("invoices")
      .update(updatedInvoice)
      .eq("date", currentDate.toISOString());

    if (error) {
      console.error("Error updating invoice:", error);
    } else {
      console.log("Invoice updated successfully:", data);
      setIsEditing(false);
      fetchInvoices();
      fetchRecentInvoices();
      fetchDailySales();
      fetchSales(salesType);

      // Update stock after updating the invoice
      await updateStockAfterInvoice(products);

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
    fetchSales(salesType);
  }, []);

  useEffect(() => {
    fetchScannedProducts();

    const scannedProductsSubscription = supabase
      .channel("scanned-products-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scanned_products" },
        (payload) => {
          console.log("Payload for scanned_products:", payload);
          handleScannedProduct(payload);
        }
      )
      .subscribe();
    // const scannedProductsSubscription = supabase
    //   .channel("custom-all-channel")
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "scanned_products" },
    //     (payload) => {
    //       console.log("payload of scanned products")
    //       handleScannedProduct(payload);
    //     }
    //   )
    //   .subscribe();

    console.log("subscribed to scanned_products");

    return () => {
      scannedProductsSubscription.unsubscribe();
    };
  }, [allproducts]);

  useEffect(() => {
    const printCommandSubscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "print_command" },
        (payload) => {
          handleRemotePrint(payload);
        }
      )
      .subscribe();

    console.log("subs");

    return () => {
      printCommandSubscription.unsubscribe();
    };
  }, [products, allproducts]);

  const handleRemotePrint = (payload) => {
    console.log("payload");
    console.log(payload.new.customer_name);
    setCustomerName(payload.new.customer_name);
    handlePrint();
  };

  // const fetchScannedProducts = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from("scanned_products")
  //       .select("*")
  //       .order("created_at", { ascending: false });

  //     if (error) throw error;

  //     console.log(data);

  //     const formattedProducts = data.map((product) => ({
  //       name: product.name,
  //       quantity: product.quantity || 1,
  //       price: product.price || 0,
  //       amount: (product.quantity || 1) * (product.price || 0),
  //     }));

  //     // setProducts(formattedProducts);
  //   } catch (error) {
  //     console.error("Error fetching scanned products:", error);
  //     setError("Failed to fetch scanned products. Please try again.");
  //   }
  // };

  const fetchScannedProducts = async () => {
    try {
      const { data: scannedData, error } = await supabase
        .from("scanned_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const productMap = new Map();

      scannedData.forEach((scannedProduct) => {
        const barcode = scannedProduct.name;
        const existingProduct = allproducts?.find(
          (p) => p?.barcode?.toString() === barcode.toString()
        );

        if (!existingProduct) {
          console.warn(`Product with barcode ${barcode} not found in catalog`);
          return;
        }

        const quantity = scannedProduct.quantity || 1;
        const price = scannedProduct.price || existingProduct.sellingPrice;

        if (productMap.has(barcode)) {
          const product = productMap.get(barcode);
          product.quantity += quantity;
          product.amount = product.quantity * price;
          product.price = price;
        } else {
          productMap.set(barcode, {
            name: existingProduct.name,
            barcode: barcode,
            quantity: quantity,
            price: price,
            amount: quantity * price,
          });
        }
      });

      const formattedProducts = Array.from(productMap.values());
      console.log(formattedProducts);

      setProducts(formattedProducts);

      if (formattedProducts.length !== scannedData.length) {
        toast({
          title: "Warning",
          description: "Some scanned products were not found in the catalog",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Error fetching scanned products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch scanned products. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScannedProduct = (payload) => {
    const scannedProduct = payload.new;
    const barcode = scannedProduct.name; // Assuming this is actually the barcode

    // Find the product in the catalog by barcode
    const existingProduct = allproducts?.find(
      (p) => p.barcode.toString() === barcode
    );

    if (!existingProduct) {
      toast({
        title: "Error",
        description: "Product not found in catalog",
        variant: "destructive",
      });
      return;
    }

    const quantity = scannedProduct.quantity || 1;
    const price = scannedProduct.price || existingProduct.sellingPrice;

    setProducts((prevProducts) => {
      const existingIndex = prevProducts.findIndex(
        (p) => p.barcode === barcode
      );

      if (existingIndex !== -1) {
        const updatedProducts = [...prevProducts];
        updatedProducts[existingIndex] = {
          ...updatedProducts[existingIndex],
          quantity: scannedProduct.quantity + quantity,
          amount: (scannedProduct.quantity + quantity) * price,
        };
        return updatedProducts;
      } else {
        // New product, add to the list
        return [
          {
            name: existingProduct.name,
            barcode: barcode,
            quantity: quantity,
            price: price,
            amount: quantity * price,
          },
          ...prevProducts,
        ];
      }
    });

    toast({
      title: "Product Scanned",
      description: `${existingProduct.name} has been added to the invoice.`,
    });
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
            total, // Format total
            formattedDate: String(d.getDate()).padStart(2, "0"),
          };
        })
        .reverse();

      setDailySales(salesArray);
    }
  };

  const fetchRecentInvoices = async () => {
    const [startYear, endYear] = selectedFinancialYear.split('-');
    const startDate = `${startYear}-04-01`; // Financial year starts from April 1st
    const endDate = `${endYear}-03-31`; // Financial year ends on March 31st
  
    const { data, error } = await supabase
      .from("invoices")
      .select()
      .gte('date', startDate)
      .lte('date', endDate)
      .order("date", { ascending: false });
  
    if (error) {
      console.error("Error fetching recent invoices:", error);
    } else {
      setRecentInvoices(data || []);
    }
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
      id: currentInvoiceId,  // Add the current invoice ID
      customerName,
      customerNumber,
      products: JSON.stringify(products),
      total: calculateTotal(),
      cash: parseFloat(cash) || 0,
      upi: parseFloat(upi) || 0,
      credit: parseFloat(credit) || 0,
      note,
      date: new Date().toISOString(), // Also add the current date
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
      fetchSales(salesType);

      // Update stock after saving the invoice
      await updateStockAfterInvoice(products);
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
    clearScannedItems();
  };

  const updateStockAfterInvoice = async (products) => {
    try {
      for (const product of products) {
        console.log(product.name);
        const { data: existingProduct, error: fetchError } = await supabase
          .from("products")
          .select()
          .ilike("name", product.name)
          .single();

        if (fetchError) throw fetchError;

        const newQuantity = existingProduct.quantity - product.quantity;

        const { error: updateError } = await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .ilike("name", product.name);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update product stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearScannedItems = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("scanned_products")
        .delete()
        .neq("id", 0);

      if (error) throw error;

      setItems([]);
      toast({
        title: "All Items Cleared",
        description: "All scanned items have been removed from the inventory.",
      });
    } catch (error) {
      console.error("Error clearing scanned items:", error);
      toast({
        title: "Error",
        description: "Failed to clear scanned items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F1") {
        event.preventDefault(); // Prevent the default F1 behavior
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePrint]);

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

  // useEffect(() => {
  //   const printCommandSubscription = supabase
  //     .channel("custom-all-channel")
  //     .on(
  //       "postgres_changes",
  //       { event: "*", schema: "public", table: "print_command" },
  //       (payload) => {
  //         console.log("payload");
  //         console.log(payload);
  //         setCustomerName(payload.customer_name);
  //         handlePrint();
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     printCommandSubscription.unsubscribe();
  //   };
  // }, [allproducts]);

  return (
    <div
      id="dashboard"
      className="flex font-sans w-full h-svh bg-zinc-80 backdrop-blur-sm"
    >
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={85}>
          <div className="flex flex-1">
            <div
              className={`transition-all duration-300 ${
                isLeftSidebarExpanded ? "w-[400px]" : "w-[4px]"
              }`}
            >
              <button className="fixed top-4 left-4 z-10 bg-purple-500 text-white p-1 rounded-full">
                {isLeftSidebarExpanded ? (
                  <ChevronLeft size={24} />
                ) : (
                  <div>
          
                    <Sheet>
                      <SheetTrigger asChild>
                        <div>
                          <ChartNoAxesCombined size={24} />
                          <div className=" h-svh w-1 fixed left-0"></div>
                        </div>
                      </SheetTrigger>
                      <SheetContent className="bg-gray-900 p-0" side={"left"}>
                        <SheetHeader>
                          <SheetTitle className="text-white">
                            Sales Information
                          </SheetTitle>
                        </SheetHeader>
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
                      </SheetContent>
                    </Sheet>
                  </div>
                )}
              </button>
            </div>

            <MainContent
              customerName={customerName}
              setCustomerName={setCustomerName}
              // customers={customers}
              // setCustomers={setCustomers}
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
              note={note}
              setNote={setNote}
              calculateTotal={calculateTotal}
              isEditing={isEditing}
              handleUpdateInvoice={handleUpdateInvoice}
              handlePrint={handlePrint}
              handleDoubleClick={handleDoubleClick}
              allProducts={allproducts}
              setCurrentView={setCurrentView}
            />

            {/* <div
          className={`transition-all duration-300 ${
            isRecentInvoicesExpanded ? "w-[300px]" : "w-[4px]"
          }`}
        >
          <button
            className="fixed top-4 right-4 z-10 bg-purple-500 text-white p-1 rounded-full"
          >
            {isRecentInvoicesExpanded ? (
              <ChevronRight size={24} />
            ) : (
              <div>
                <Sheet>
                  <SheetTrigger asChild>
                    <div>
                      <ReceiptText size={24} />
                      <div
                        className="h-svh w-1 fixed right-0"
                      ></div>
                    </div>
                  </SheetTrigger>
                  <SheetContent className="bg-gray-900 p-0">
                    <SheetHeader>
                      <SheetTitle className="text-white">
                        Recent Invoices
                      </SheetTitle>
                    </SheetHeader>
                    <RecentInvoices
                      recentInvoices={recentInvoices}
                      handleInvoiceClick={handleInvoiceClick}
                      formatDate={formatDate}
                    />
                  </SheetContent>
                </Sheet>
              </div>
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
        </div> */}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={15} maxSize={25}>
        <div className="w-full p-2">
            <select
              value={selectedFinancialYear}
              onChange={handleFinancialYearChange}
              className="px-2 py-1 rounded-md border bg-gray-900 text-white"
            >
              {getFinancialYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <RecentInvoices
            recentInvoices={recentInvoices}
            handleInvoiceClick={handleInvoiceClick}
            formatDate={formatDate}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setShowInvoiceModal(false)}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
        />
      )}

      {error && (
        <Alert variant="destructive" className="fixed bottom-4 right-4 w-96">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </Alert>
      )}
    </div>
  );
};

export default Dashboard;
