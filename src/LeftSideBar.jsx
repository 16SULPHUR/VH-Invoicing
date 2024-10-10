import React from 'react';
import DailySalesChart from './DailySalesChart';
import SalesInfo from './SalesInfo';

const LeftSidebar = ({ dailySales, salesType, salesData, cashSales, upiSales, creditSales, handleSalesTypeChange, customDateRange, handleCustomDateChange, fetchSales }) => (
  <div className="w-[400px] h-[90vh] overflow-y-scroll rounded-md px-2">
    <h3 className="text-lg font-bold text-sky-500 mb-2.5">Daily Sales</h3>
    <DailySalesChart dailySales={dailySales} />
    <div>
      <h3 className="text-lg font-bold text-sky-500 mb-2.5">Sales Information</h3>
      <SalesInfo
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
  </div>
);

export default LeftSidebar