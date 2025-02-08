import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileDown, Search } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import MainContent from "../MainContent";

const GenerateReports = () => {
  const [creditData, setCreditData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInvoiceEditDialogOpen, setIsInvoiceEditDialogOpen] = useState(false);
  const [summary, setSummary] = useState({
    totalCredit: 0,
    totalCustomers: 0,
    totalInvoices: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState();
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const { toast } = useToast();

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
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const [credit, setCredit] = useState("");

  const fetchCreditData = async () => {
    setIsLoading(true);
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(
          `
          id,
          customerName,
          date,
          total,
          credit,
          cash,
          upi,
          products
        `
        )
        .gt("credit", 0)
        .order("date", { ascending: false });

      if (error) throw error;

      const groupedData = invoices.reduce((acc, invoice) => {
        if (!acc[invoice.customerName]) {
          acc[invoice.customerName] = {
            customerName: invoice.customerName,
            totalCredit: 0,
            invoices: [],
          };
        }

        acc[invoice.customerName].invoices.push(invoice);
        acc[invoice.customerName].totalCredit += invoice.credit;

        return acc;
      }, {});

      const summaryData = {
        totalCredit: invoices.reduce((sum, inv) => sum + inv.credit, 0),
        totalCustomers: Object.keys(groupedData).length,
        totalInvoices: invoices.length,
      };

      setCreditData(Object.values(groupedData));
      setFilteredData(Object.values(groupedData));
      setSummary(summaryData);
    } catch (error) {
      console.error("Error fetching credit data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch credit data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditData();
  }, []);

  useEffect(() => {
    let filtered = creditData.filter((customer) =>
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (paymentStatusFilter !== "all") {
      filtered = filtered
        .map((customer) => ({
          ...customer,
          invoices: customer.invoices.filter(
            (invoice) => invoice.paymentStatus === paymentStatusFilter
          ),
        }))
        .filter((customer) => customer.invoices.length > 0);
    }

    setFilteredData(filtered);
  }, [searchTerm, paymentStatusFilter, creditData]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Customer Name",
      "Invoice ID",
      "Date",
      "Total Amount",
      "Credit Amount",
      "Paid Amount",
      "Payment Status",
    ];
    const rows = filteredData.flatMap((customer) =>
      customer.invoices.map((invoice) => [
        customer.customerName,
        invoice.id,
        formatDate(invoice.date),
        invoice.total,
        invoice.credit,
        invoice.total - invoice.credit,
        invoice.paymentStatus,
      ])
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit_report_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updatePaymentStatus = async (invoiceId, status) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ paymentStatus: status })
        .eq("id", invoiceId);

      if (error) throw error;

      fetchCreditData();
      toast({
        title: "Success",
        description: "Payment status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment status. Please try again.",
      });
    }
  };

  const openEditInvoiceDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceEditDialogOpen(true);
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

      // Clear the form after updating
      setProducts([]);
      setCustomerName("");
      setCustomerNumber("");
      setCurrentDate(new Date());
      setCash("");
      setUpi("");
      setCredit("");
      setNote("");
      setIsInvoiceEditDialogOpen(false);
      fetchCreditData()
    }
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
      fetchSales(salesType);
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
    setIsInvoiceEditDialogOpen(true);
  };

  return (
    <div className="margin-b-4 mx-auto">
      <Card className="bg-gray-900 border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sky-400 text-2xl font-bold">Credit Reports</CardTitle>
            <Button
              onClick={exportToCSV}
              className="bg-sky-600 hover:bg-sky-700 text-white"
              disabled={isLoading || filteredData.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 text-white border-gray-700 focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 grid-cols-1 gap-4 mb-2">
            {[
              { title: "Total Credit", value: `₹${summary.totalCredit.toFixed(2)}` },
              { title: "Customers with Credit", value: summary.totalCustomers },
              { title: "Total Credit Invoices", value: summary.totalInvoices },
            ].map((item, index) => (
              <Card key={index} className="bg-gray-800 border-0 shadow-md">
                <CardContent className="pb-2 pt-2">
                  <p className="text-sm text-sky-400 mb-1">{item.title}</p>
                  <p className="text-2xl font-bold text-white mb-0">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <ScrollArea className="h-[calc(100vh-25rem)] p-2 outline outline-1 outline-white">
            <Accordion type="single" collapsible className="space-y-2 ">
              {filteredData.map((customer) => (
                <AccordionItem
                  key={customer.customerName}
                  value={customer.customerName}
                  className="bg-gray-800 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-gray-700">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-white font-medium text-xl">{customer.customerName}</span>
                      <span className="text-sky-400 font-bold text-xl">₹{customer.totalCredit.toFixed(2)}</span>
                      {/* <span className="text-sky-400 font-bold text-xl"></span> */}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3 pt-1">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-700">
                          <TableHead className="text-sky-400">ID</TableHead>
                          <TableHead className="text-sky-400">Date</TableHead>
                          <TableHead className="text-sky-400">Total</TableHead>
                          <TableHead className="text-sky-400">Credit</TableHead>
                          <TableHead className="text-sky-400">Paid</TableHead>
                          <TableHead className="text-sky-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.invoices.map((invoice) => (
                          <TableRow key={invoice.id} className="text-white border-b border-gray-700">
                            <TableCell className="font-medium">#{invoice.id}</TableCell>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell>₹{invoice.total.toFixed(2)}</TableCell>
                            <TableCell className="text-red-400">₹{invoice.credit.toFixed(2)}</TableCell>
                            <TableCell className="text-green-400">
                              ₹{(invoice.total - invoice.credit).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditInvoice(invoice)}
                                className="text-sky-400 border-sky-400 hover:bg-sky-400 hover:text-white"
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isInvoiceEditDialogOpen} onOpenChange={setIsInvoiceEditDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100 max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-sky-400">Edit Invoice</DialogTitle>
          </DialogHeader>
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
            note={note}
            setNote={setNote}
            calculateTotal={calculateTotal}
            isEditing={isEditing}
            handleUpdateInvoice={handleUpdateInvoice}
            handlePrint={handlePrint}
            handleDoubleClick={handleDoubleClick}
            allProducts={allproducts}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
};

export default GenerateReports;
