import React from 'react';
import CustomerDetails from './CustomerDetails';
import InvoiceDetails from './InvoiceDetails';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';
import PaymentDetails from './PaymentDetails';
import NoteField from './NoteField';

const MainContent = ({
    customerName, setCustomerName, customerNumber, setCustomerNumber,
    currentInvoiceId, getCurrentFormattedDate, setCurrentDate,
    handleSubmit, productName, setProductName, productQuantity, setProductQuantity,
    productPrice, setProductPrice, editingProduct, products, startEditing, deleteProduct,
    cash, setCash, upi, setUpi, credit, setCredit, handleDoubleClick,
    note, setNote, calculateTotal, isEditing, handleUpdateInvoice, handlePrint
  }) => (
    <div className="flex-grow border p-3">
      <h5 className="text-center font-bold bg-sky-500 text-white border border-black p-1.5">
        Create Invoice
      </h5>
  
      <CustomerDetails
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerNumber={customerNumber}
        setCustomerNumber={setCustomerNumber}
      />
  
      <InvoiceDetails
        currentInvoiceId={currentInvoiceId}
        getCurrentFormattedDate={getCurrentFormattedDate}
        setCurrentDate={setCurrentDate}
      />
  
      <ProductForm
        handleSubmit={handleSubmit}
        productName={productName}
        setProductName={setProductName}
        productQuantity={productQuantity}
        setProductQuantity={setProductQuantity}
        productPrice={productPrice}
        setProductPrice={setProductPrice}
        editingProduct={editingProduct}
      />
  
      <h5 className="text-lg font-semibold mb-2 text-sky-500">
        {editingProduct !== null ? "Edit Product" : "Add Product"}
      </h5>
  
      <ProductTable
        products={products}
        startEditing={startEditing}
        deleteProduct={deleteProduct}
      />
  
      <div className="text-right font-bold text-sky-500">
        Total: ₹ {calculateTotal()}
      </div>
  
      <PaymentDetails
        cash={cash}
        setCash={setCash}
        upi={upi}
        setUpi={setUpi}
        credit={credit}
        setCredit={setCredit}
        handleDoubleClick={handleDoubleClick}
      />
  
      <NoteField note={note} setNote={setNote} />
  
      <div className="mt-5 text-right">
        <button
          type="button"
          className={`bg-${isEditing ? "yellow" : "sky"}-500 text-white px-4 py-2 rounded-md cursor-pointer`}
          onClick={isEditing ? handleUpdateInvoice : handlePrint}
        >
          {isEditing ? "Update Invoice" : "Generate Invoice"}
        </button>
      </div>
    </div>
  );
  export default MainContent