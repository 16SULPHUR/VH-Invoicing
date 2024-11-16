// import React from 'react';

// const ProductTable = ({ products, startEditing, deleteProduct }) => (
//   <table className="w-full border-collapse mb-5">
//     <thead>
//       <tr>
//         <th className="bg-sky-500 text-white border border-sky-600 p-2.5 text-left">Item Name</th>
//         <th className="bg-sky-500 text-white border border-sky-600 p-2.5 text-left">Quantity</th>
//         <th className="bg-sky-500 text-white border border-sky-600 p-2.5 text-left">Price/Unit</th>
//         <th className="bg-sky-500 text-white border border-sky-600 p-2.5 text-left">Amount</th>
//         <th className="bg-sky-500 text-white border border-sky-600 p-2.5 text-left">Action</th>
//       </tr>
//     </thead>
//     <tbody>
//       {products.map((product, index) => (
//         <tr key={index} className="bg-gray-800">
//           <td className="border border-gray-700 text-white font-semibold text-lg p-2.5">{product.name}</td>
//           <td className="border border-gray-700 text-white font-semibold text-lg p-2.5">{product.quantity}</td>
//           <td className="border border-gray-700 text-white font-semibold text-lg p-2.5">₹ {product.price.toFixed(2)}</td>
//           <td className="border border-gray-700 text-white font-semibold text-lg p-2.5">₹ {product.amount.toFixed(2)}</td>
//           <td className="border border-gray-700 text-white font-semibold text-lg p-2.5">
//             <button className="bg-sky-500 text-white px-2 py-1 rounded-md mr-2 hover:bg-sky-600 transition-colors" onClick={() => startEditing(index)}>
//               Edit
//             </button>
//             <button className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition-colors" onClick={() => deleteProduct(index)}>
//               Remove
//             </button>
//           </td>
//         </tr>
//       ))}
//     </tbody>
//   </table>
// );

// export default ProductTable;
import React from 'react';

const ProductTable = ({ products, startEditing, deleteProduct }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse mb-5">
      <thead>
        <tr>
          <th className="bg-sky-500 text-white border border-sky-600 p-2 text-left">Item Name</th>
          <th className="bg-sky-500 text-white border border-sky-600 p-2 text-left">Quantity</th>
          <th className="bg-sky-500 text-white border border-sky-600 p-2 text-left">Price/Unit</th>
          <th className="bg-sky-500 text-white border border-sky-600 p-2 text-left">Amount</th>
          <th className="bg-sky-500 text-white border border-sky-600 p-2 text-left">Action</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product, index) => (
          <tr key={index} className="bg-gray-800">
            <td className="border border-gray-700 text-white font-semibold text-sm md:text-base p-2">{product.name}</td>
            <td className="border border-gray-700 text-white font-semibold text-sm md:text-base p-2">{product.quantity}</td>
            <td className="border border-gray-700 text-white font-semibold text-sm md:text-base p-2">₹ {product.price.toFixed(2)}</td>
            <td className="border border-gray-700 text-white font-semibold text-sm md:text-base p-2">₹ {product.amount.toFixed(2)}</td>
            <td className="border border-gray-700 text-white font-semibold text-sm md:text-base p-2">
              <button className="bg-sky-500 text-white px-2 py-1 rounded-md mr-2 hover:bg-sky-600 transition-colors text-xs md:text-sm" onClick={() => startEditing(index)}>
                Edit
              </button>
              <button className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition-colors text-xs md:text-sm" onClick={() => deleteProduct(index)}>
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ProductTable;