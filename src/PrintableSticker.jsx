import React from 'react'

const PrintableSticker = ({ sku, price, quantity, barcodeUrl }) => {
    return (
      <div className="sticker text-white">
        <h2>Product Sticker</h2>
        <p>SKU: {sku}</p>
        <p>Price: ${price}</p>
        <p>Quantity: {quantity}</p>
        {barcodeUrl && <img src={barcodeUrl} alt="Barcode" />}
      </div>
    );
  };

export default PrintableSticker