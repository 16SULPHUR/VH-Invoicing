import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Download, FileDown, Search } from "lucide-react";
import { supabase } from '../supabaseClient';
import { useToast } from "@/hooks/use-toast";

const GenerateReports = () => {
  const [creditData, setCreditData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalCredit: 0,
    totalCustomers: 0,
    totalInvoices: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const { toast } = useToast();

  const fetchCreditData = async () => {
    setIsLoading(true);
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          customerName,
          date,
          total,
          credit,
          cash,
          upi,
          products
        `)
        .gt('credit', 0)
        .order('date', { ascending: false });

      if (error) throw error;

      const groupedData = invoices.reduce((acc, invoice) => {
        if (!acc[invoice.customerName]) {
          acc[invoice.customerName] = {
            customerName: invoice.customerName,
            totalCredit: 0,
            invoices: []
          };
        }
        
        acc[invoice.customerName].invoices.push(invoice);
        acc[invoice.customerName].totalCredit += invoice.credit;
        
        return acc;
      }, {});

      const summaryData = {
        totalCredit: invoices.reduce((sum, inv) => sum + inv.credit, 0),
        totalCustomers: Object.keys(groupedData).length,
        totalInvoices: invoices.length
      };

      setCreditData(Object.values(groupedData));
      setFilteredData(Object.values(groupedData));
      setSummary(summaryData);

    } catch (error) {
      console.error('Error fetching credit data:', error);
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
    let filtered = creditData.filter(customer => 
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (paymentStatusFilter !== 'all') {
      filtered = filtered.map(customer => ({
        ...customer,
        invoices: customer.invoices.filter(invoice => invoice.paymentStatus === paymentStatusFilter)
      })).filter(customer => customer.invoices.length > 0);
    }

    setFilteredData(filtered);
  }, [searchTerm, paymentStatusFilter, creditData]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Customer Name', 'Invoice ID', 'Date', 'Total Amount', 'Credit Amount', 'Paid Amount', 'Payment Status'];
    const rows = filteredData.flatMap(customer => 
      customer.invoices.map(invoice => [
        customer.customerName,
        invoice.id,
        formatDate(invoice.date),
        invoice.total,
        invoice.credit,
        invoice.total - invoice.credit,
        invoice.paymentStatus
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updatePaymentStatus = async (invoiceId, status) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ paymentStatus: status })
        .eq('id', invoiceId);

      if (error) throw error;

      fetchCreditData();
      toast({
        title: "Success",
        description: "Payment status updated successfully.",
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment status. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900 border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-sky-400">Credit Reports</CardTitle>
            <Button 
              onClick={exportToCSV}
              className="bg-sky-600 hover:bg-sky-700"
              disabled={isLoading || filteredData.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtering and Search */}
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-1/3"
            />
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-1/3">
                <SelectValue placeholder="Filter by payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="bg-gray-800 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-sky-400">Total Credit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">₹{summary.totalCredit.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-sky-400">Customers with Credit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{summary.totalCustomers}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-sky-400">Total Credit Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{summary.totalInvoices}</p>
              </CardContent>
            </Card>
          </div>

          {/* Credit Details */}
          <ScrollArea className="h-[calc(100vh-15rem)]">
            <Accordion type="single" collapsible className="space-y-4">
              {filteredData.map((customer) => (
                <AccordionItem 
                  key={customer.customerName}
                  value={customer.customerName}
                  className="bg-gray-800 rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-white">{customer.customerName}</span>
                      <span className="text-sky-400">₹{customer.totalCredit.toFixed(2)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sky-400">Invoice ID</TableHead>
                          <TableHead className="text-sky-400">Date</TableHead>
                          <TableHead className="text-sky-400">Total</TableHead>
                          <TableHead className="text-sky-400">Credit</TableHead>
                          <TableHead className="text-sky-400">Paid</TableHead>
                          <TableHead className="text-sky-400">Payment Status</TableHead>
                          <TableHead className="text-sky-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.invoices.map((invoice) => (
                          <TableRow key={invoice.id} className="text-white">
                            <TableCell>#{invoice.id}</TableCell>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell>₹{invoice.total.toFixed(2)}</TableCell>
                            <TableCell className="text-red-400">₹{invoice.credit.toFixed(2)}</TableCell>
                            <TableCell className="text-green-400">₹{(invoice.total - invoice.credit).toFixed(2)}</TableCell>
                            <TableCell>
                              <Select 
                                value={invoice.paymentStatus} 
                                onValueChange={(value) => updatePaymentStatus(invoice.id, value)}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditInvoice(invoice)}
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
    </div>
  );
};

export default GenerateReports;