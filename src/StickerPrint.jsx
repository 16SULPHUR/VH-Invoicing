// StickerPrint.jsx
import React from 'react';
import Barcode from 'react-barcode';

const StickerPrint = ({ sku, price, quantity }) => {
  return (
    <div className="flex flex-col items-center p-4 border-2 border-gray-400 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold">Product Sticker</h2>
      <p className="mt-2">SKU: {sku}</p>
      <p>Price: ${price}</p>
      <p>Quantity: {quantity}</p>
      
      {sku && (
        <div className="mt-4">
          <Barcode value={sku} />
        </div>
      )}
    </div>
  );
};

export default StickerPrint;
