// import React from 'react';

// const InvoiceDetails = ({ currentInvoiceId, getCurrentFormattedDate, setCurrentDate }) => (
//   <div className="flex justify-between mb-4 w-full">
//     <div className="w-[48%]">
//       <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="invoiceId">
//         Invoice No:
//       </label>
//       <input
//         className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
//         type="text"
//         id="invoiceId"
//         value={currentInvoiceId || ""}
//         readOnly
//       />
//     </div>
//     <div className="w-[48%]">
//       <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="invoiceDate">
//         Date:
//       </label>
//       <input
//         className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
//         type="text"
//         id="invoiceDate"
//         value={getCurrentFormattedDate()}
//         onChange={(e) => setCurrentDate(e.target.value)}
//       />
//     </div>
//   </div>
// );

// export default InvoiceDetails;


import React from 'react';

const InvoiceDetails = ({ currentInvoiceId, getCurrentFormattedDate, setCurrentDate }) => (
  <div className="flex flex-col md:flex-row justify-between mb-4 w-full gap-4">
    <div className="w-full md:w-[48%]">
      <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="invoiceId">
        Invoice No:
      </label>
      <input
        className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
        type="text"
        id="invoiceId"
        value={currentInvoiceId || ""}
        readOnly
      />
    </div>
    <div className="w-full md:w-[48%]">
      <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="invoiceDate">
        Date:
      </label>
      <input
        className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
        type="text"
        id="invoiceDate"
        value={getCurrentFormattedDate()}
        onChange={(e) => setCurrentDate(e.target.value)}
      />
    </div>
  </div>
);

export default InvoiceDetails;