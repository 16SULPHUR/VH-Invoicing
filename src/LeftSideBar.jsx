import React from 'react';
import DailySalesChart from './DailySalesChart';
import SalesInfo from './SalesInfo';

const LeftSidebar = ({ dailySales, salesType, salesData, cashSales, upiSales, creditSales, handleSalesTypeChange, customDateRange, handleCustomDateChange, fetchSales, todayCollections }) => (
  // <div className="w-[400px] h-[90vh] overflow-y-auto rounded-md px-2 pt-3 text-gray-100">
  <div className="w-full h-[90vh] overflow-y-auto rounded-md px-2 pt-3 text-gray-100">
    {/* <h3 className="text-lg font-bold text-pink-500 mb-2.5">Daily Sales</h3> */}
    <DailySalesChart dailySales={dailySales} />
    <div className='mt-4 grid grid-cols-3 gap-2 text-center'>
      <div className='bg-green-800/50 border border-green-700 rounded p-2'>
        <div className='text-xs text-green-300'>Cash (Today)</div>
        <div className='text-lg font-semibold'>₹{Number(todayCollections?.cash || 0).toFixed(2)}</div>
      </div>
      <div className='bg-pink-800/50 border border-pink-700 rounded p-2'>
        <div className='text-xs text-pink-300'>UPI (Today)</div>
        <div className='text-lg font-semibold'>₹{Number(todayCollections?.upi || 0).toFixed(2)}</div>
      </div>
      <div className='bg-yellow-800/50 border border-yellow-700 rounded p-2'>
        <div className='text-xs text-yellow-300'>Credit (Today)</div>
        <div className='text-lg font-semibold'>₹{Number(todayCollections?.credit || 0).toFixed(2)}</div>
      </div>
    </div>
    <div className='mt-5'>
      <h3 className="text-lg font-bold text-pink-500 mb-2.5"></h3>
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