import React from 'react';

const ProductForm = ({ handleSubmit, productName, setProductName, productQuantity, setProductQuantity, productPrice, setProductPrice, editingProduct }) => (
  <form onSubmit={handleSubmit}>
    <div className="flex justify-between mb-4">
      <div className="w-[48%]">
        <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="productName">
          Product Name:
        </label>
        <input
          className="w-full p-2 border border-gray-300 rounded-md"
          type="text"
          id="productName"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>
      <div className="w-[24%]">
        <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="productQuantity">
          Quantity:
        </label>
        <input
          className="w-full p-2 border border-gray-300 rounded-md"
          type="number"
          id="productQuantity"
          value={productQuantity}
          onChange={(e) => setProductQuantity(e.target.value)}
        />
      </div>
      <div className="w-[24%]">
        <label className="block mb-1 font-bold text-sky-500 text-sm" htmlFor="productPrice">
          Price/Unit:
        </label>
        <input
          className="w-full p-2 border border-gray-300 rounded-md"
          type="number"
          id="productPrice"
          value={productPrice}
          onChange={(e) => setProductPrice(e.target.value)}
        />
      </div>
    </div>
    <div className="text-right">
      <button type="submit" className="bg-sky-500 text-white px-4 py-2 rounded-md cursor-pointer">
        {editingProduct !== null ? "Update Product" : "Add Product"}
      </button>
    </div>
  </form>
);

export default ProductForm