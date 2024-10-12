import React, { useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import ReactDOMServer from "react-dom/server";

const PrintableSticker = ({ sku, price, quantity, barcodeUrl }) => {
  return (
    <div style={{width:"2in", height:"1in"}} className="sticker rounded-md text-center">
      {/* <h2 id='sticker-head' className="text-xs font-semibold leading-5">VARIETY HEAVEN</h2> */}
      <p className='font-mono font-semibold text-xs'>MRP: ₹{price}</p>
      {barcodeUrl && <img src={barcodeUrl} alt="Barcode" className="leading-3 h-16 mx-auto" />}
      {/* <p className='font-mono font-semibold text-md leading-3'>Mo: 8160185875, 9898437599</p> */}
      {/* <p className='font-mono font-semibold text-sm leading-3'>09, Sentosa Enclave, Dindoli, Surat</p> */}
    </div>
  );
};

const ProductSticker = () => {
  const [sku, setSku] = useState('SAMPLE SKU');
  const [price, setPrice] = useState('19999');
  const [quantity, setQuantity] = useState('33');
  const [barcodeUrl, setBarcodeUrl] = useState('');

  useEffect(() => {
    if (sku) {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, sku, { format: 'CODE128' });
      setBarcodeUrl(canvas.toDataURL('image/png'));
    }
  }, [sku]);

  const handlePrint = () => {
    if (!sku || !price || !quantity) {
      alert("Please fill in all fields before printing the sticker.");
      return;
    }

    const printContent = (<PrintableSticker sku={sku} barcodeUrl={barcodeUrl} price={price}/>)

    const printWindow = window.open('', '', 'width=1000,height=1000');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Product Sticker</title>
        </head>
        <body>
          ${ReactDOMServer.renderToString(printContent)}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    // setSku('');
    // setPrice('');
    // setQuantity('');
  };

  return (
    <div className="flex-grow border p-3 h-screen overflow-auto backdrop-blur-sm">
        <div className='bg-white w-fit m-10'>
            <PrintableSticker sku={sku} barcodeUrl={barcodeUrl} price={price}/>
        </div>
      <h5 className="text-center font-bold bg-sky-500 text-white border border-black p-1.5 mb-4">
        Create Product Sticker
      </h5>

      <form className="mb-4">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">SKU:</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">Price:</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
      </form>

      {/* <div className="mb-4">
        <h5 className="text-lg font-semibold mb-2 text-sky-500">Sticker Preview</h5>
        <PrintableSticker
          sku={sku}
          price={price}
          quantity={quantity}
          barcodeUrl={barcodeUrl}
        />
      </div> */}

      <div className="mt-5 text-right">
        <button
          type="button"
          className="bg-sky-500 text-white px-4 py-2 rounded-md cursor-pointer"
          onClick={handlePrint}
        >
          Generate Sticker
        </button>
      </div>
    </div>
  );
};

export default ProductSticker;