import React from 'react';

const ProductTable = ({ products, startEditing, deleteProduct }) => (
  <table className="w-full border-collapse mb-5">
    <thead>
      <tr>
        <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Item Name</th>
        <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Quantity</th>
        <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Price/Unit</th>
        <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Amount</th>
        <th className="bg-sky-500 text-white border border-black p-2.5 text-left">Action</th>
      </tr>
    </thead>
    <tbody>
      {products.map((product, index) => (
        <tr key={index}>
          <td className="border border-white text-white font-semibold text-lg p-2.5">{product.name}</td>
          <td className="border border-white text-white font-semibold text-lg p-2.5">{product.quantity}</td>
          <td className="border border-white text-white font-semibold text-lg p-2.5">₹ {product.price.toFixed(2)}</td>
          <td className="border border-white text-white font-semibold text-lg p-2.5">₹ {product.amount.toFixed(2)}</td>
          <td className="border border-white text-white font-semibold text-lg p-2.5">
            <button className="bg-sky-500 text-white px-2 py-1 rounded-md mr-2" onClick={() => startEditing(index)}>
              Edit
            </button>
            <button className="bg-red-500 text-white px-2 py-1 rounded-md" onClick={() => deleteProduct(index)}>
              Remove
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default ProductTable