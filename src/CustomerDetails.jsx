import React from 'react';

const CustomerDetails = ({ customerName, setCustomerName, customerNumber, setCustomerNumber }) => (
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
);

export default CustomerDetails