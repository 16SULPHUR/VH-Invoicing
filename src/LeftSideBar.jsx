import React from 'react';
import DailySalesChart from './DailySalesChart';
import SalesInfo from './SalesInfo';

const LeftSidebar = ({ dailySales, salesType, salesData, cashSales, upiSales, creditSales, handleSalesTypeChange, customDateRange, handleCustomDateChange, fetchSales }) => (
  // <div className="w-[400px] h-[90vh] overflow-y-auto rounded-md px-2 pt-3 text-gray-100">
  <div className="w-full h-[90vh] overflow-y-auto rounded-md px-2 pt-3 text-gray-100">
    {/* <h3 className="text-lg font-bold text-sky-500 mb-2.5">Daily Sales</h3> */}
    <DailySalesChart dailySales={dailySales} />
    <div className='mt-5'>
      <h3 className="text-lg font-bold text-sky-500 mb-2.5"></h3>
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

export default LeftSidebar;