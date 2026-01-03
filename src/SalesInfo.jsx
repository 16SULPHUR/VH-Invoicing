import React from 'react';

const SalesInfo = ({ salesType, salesData, cashSales, upiSales, creditSales, handleSalesTypeChange, customDateRange, handleCustomDateChange, fetchSales }) => (
  <div className="mb-5 bg-gray-800 rounded-md shadow-md p-4 border border-gray-700">
    <label htmlFor="salesPeriod" className="block mb-2 font-semibold text-pink-500">
      Select Sales Period:
    </label>
    <select
      id="salesPeriod"
      className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:border-pink-500 focus:outline-none"
      value={salesType}
      onChange={handleSalesTypeChange}
    >
      <option value="today">Today</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
      <option value="custom">Custom Date Range</option>
    </select>

    {salesType === "custom" && (
      <div className="mt-4">
        <label className="block mb-1 text-sm text-pink-500" htmlFor="start">
          Start Date:
        </label>
        <input
          type="date"
          name="start"
          className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:border-pink-500 focus:outline-none"
          value={customDateRange.start}
          onChange={handleCustomDateChange}
        />
        <label className="block mt-4 mb-1 text-sm text-pink-500" htmlFor="end">
          End Date:
        </label>
        <input
          type="date"
          name="end"
          className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:border-pink-500 focus:outline-none"
          value={customDateRange.end}
          onChange={handleCustomDateChange}
        />
        <button
          className="mt-4 w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-600 transition-colors"
          onClick={() => fetchSales("custom")}
        >
          Fetch Custom Sales
        </button>
      </div>
    )}

    <div className="mt-6">
      <h4 className="text-lg font-semibold text-pink-500">Total Sales:</h4>
      <p className="text-3xl text-white mt-2">₹ {salesData}</p>
    </div>
    <div className="flex gap-3 mt-4">
      <span className="bg-green-700 font-semibold text-lg text-white rounded-md px-2 py-1">
        💸 ₹{cashSales}
      </span>
      <span className="bg-pink-700 font-semibold text-lg text-white rounded-md px-2 py-1">
        🏛️ ₹{upiSales}
      </span>
      <span className="bg-red-700 font-semibold text-lg text-white rounded-md px-2 py-1">
        ❌ ₹{creditSales}
      </span>
    </div>
  </div>
);

export default SalesInfo;