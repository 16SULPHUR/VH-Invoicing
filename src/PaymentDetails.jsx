// import React from 'react';

// const PaymentDetails = ({ cash, setCash, upi, setUpi, credit, setCredit, handleDoubleClick }) => (
//   <div className="flex justify-around mb-4">
//     <div className="mb-4">
//       <label className="block mb-1 font-bold text-sky-500 text-sm ps-5" htmlFor="cash">
//         Cash:
//       </label>
//       <div className="flex gap-3 items-center">
//         <span className="text-3xl cursor-pointer" onDoubleClick={() => handleDoubleClick("cash")}>
//           💸
//         </span>
//         <input
//           className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
//           placeholder="Cash"
//           type="number"
//           id="cash"
//           value={cash}
//           onChange={(e) => setCash(e.target.value)}
//         />
//       </div>
//     </div>

//     <div className="mb-4">
//       <label className="block mb-1 font-bold text-sky-500 text-sm ps-5" htmlFor="upi">
//         UPI:
//       </label>
//       <div className="flex gap-3 items-center">
//         <span className="text-3xl cursor-pointer" onDoubleClick={() => handleDoubleClick("upi")}>
//           🏛️
//         </span>
//         <input
//           className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
//           placeholder="UPI"
//           type="number"
//           id="upi"
//           value={upi}
//           onChange={(e) => setUpi(e.target.value)}
//         />
//       </div>
//     </div>

//     <div className="mb-4">
//       <label className="block mb-1 font-bold text-sky-500 text-sm ps-5" htmlFor="credit">
//         Credit:
//       </label>
//       <div className="flex gap-3 items-center">
//         <span className="text-3xl cursor-pointer" onDoubleClick={() => handleDoubleClick("credit")}>
//           ❌
//         </span>
//         <input
//           className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
//           placeholder="Credit"
//           type="number"
//           id="credit"
//           value={credit}
//           onChange={(e) => setCredit(e.target.value)}
//         />
//       </div>
//     </div>
//   </div>
// );

// export default PaymentDetails;
import React from 'react';

const PaymentDetails = ({ cash, setCash, upi, setUpi, credit, setCredit, handleDoubleClick }) => (
  <div className="flex flex-col md:flex-row justify-around mb-4 gap-4">
    <div className="w-full md:w-1/3">
      <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="cash">
        Cash:
      </label>
      <div className="flex gap-3 items-center">
        <span className="text-3xl cursor-pointer" onDoubleClick={() => handleDoubleClick("cash")}>
          💸
        </span>
        <input
          className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
          placeholder="Cash"
          type="number"
          id="cash"
          value={cash}
          onChange={(e) => setCash(e.target.value)}
        />
      </div>
    </div>

    <div className="w-full md:w-1/3">
      <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="upi">
        UPI:
      </label>
      <div className="flex gap-3 items-center">
        <span className="text-3xl cursor-pointer" onDoubleClick={() => handleDoubleClick("upi")}>
          🏛️
        </span>
        <input
          className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
          placeholder="UPI"
          type="number"
          id="upi"
          value={upi}
          onChange={(e) => setUpi(e.target.value)}
        />
      </div>
    </div>

    <div className="w-full md:w-1/3">
      <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="credit">
        Credit:
      </label>
      <div className="flex gap-3 items-center">
        <span className="text-3xl cursor-pointer" onDoubleClick={() => handleDoubleClick("credit")}>
          ❌
        </span>
        <input
          className="w-full p-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:border-sky-500 focus:outline-none"
          placeholder="Credit"
          type="number"
          id="credit"
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
        />
      </div>
    </div>
  </div>
);

export default PaymentDetails;