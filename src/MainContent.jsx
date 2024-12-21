// import React from "react";
// import CustomerDetails from "./CustomerDetails";
// import InvoiceDetails from "./InvoiceDetails";
// import ProductForm from "./ProductForm";
// import ProductTable from "./ProductTable";
// import PaymentDetails from "./PaymentDetails";
// import NoteField from "./NoteField";
// import { FilePen, FilePenIcon, FilePlus, FilePlus2, LucideFilePen } from "lucide-react";

// const MainContent = ({
//   customerName,
//   setCustomerName,
//   customerNumber,
//   setCustomerNumber,
//   currentInvoiceId,
//   getCurrentFormattedDate,
//   setCurrentDate,
//   handleSubmit,
//   productName,
//   setProductName,
//   productQuantity,
//   setProductQuantity,
//   productPrice,
//   setProductPrice,
//   editingProduct,
//   products,
//   startEditing,
//   deleteProduct,
//   cash,
//   setCash,
//   upi,
//   setUpi,
//   credit,
//   setCredit,
//   handleDoubleClick,
//   note,
//   setNote,
//   calculateTotal,
//   isEditing,
//   handleUpdateInvoice,
//   handlePrint,
//   allProducts,
// }) => (
//   <div className="flex-grow border border-gray-700 p-3 h-screen overflow-auto bg-gray-900 text-gray-100">
//     <h5 className="text-center font-bold bg-sky-500 text-white border border-sky-600 p-1.5 mb-4 rounded">
//       Create Invoice
//     </h5>

//     <div className="flex w-full justify-between gap-5">
//       <CustomerDetails
//         customerName={customerName}
//         setCustomerName={setCustomerName}
//         customerNumber={customerNumber}
//         setCustomerNumber={setCustomerNumber}
//       />

//       <InvoiceDetails
//         currentInvoiceId={currentInvoiceId}
//         getCurrentFormattedDate={getCurrentFormattedDate}
//         setCurrentDate={setCurrentDate}
//       />
//     </div>

//     <ProductForm
//       handleSubmit={handleSubmit}
//       productName={productName}
//       setProductName={setProductName}
//       productQuantity={productQuantity}
//       setProductQuantity={setProductQuantity}
//       productPrice={productPrice}
//       setProductPrice={setProductPrice}
//       editingProduct={editingProduct}
//       products={allProducts}
//     />

//     <h5 className="text-lg font-semibold mb-2 text-sky-500">
//       {editingProduct !== null ? "Edit Product" : "Add Product"}
//     </h5>

//     <ProductTable
//       products={products}
//       startEditing={startEditing}
//       deleteProduct={deleteProduct}
//     />

//     <div className="text-right font-bold text-sky-500">
//       Total: ₹ {calculateTotal()}
//     </div>

//     <PaymentDetails
//       cash={cash}
//       setCash={setCash}
//       upi={upi}
//       setUpi={setUpi}
//       credit={credit}
//       setCredit={setCredit}
//       handleDoubleClick={handleDoubleClick}
//     />

//     <NoteField note={note} setNote={setNote} />

//     <div className="mt-5 text-right sticky bottom-8 right-10">
//       <button
//         type="button"
//         className={`bg-${
//           isEditing ? "yellow" : "red"
//         }-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-${
//           isEditing ? "yellow" : "red"
//         }-600 transition-colors`}
//         onClick={isEditing ? handleUpdateInvoice : handlePrint}
//       >
//         {isEditing ? (
//           <div className="flex gap-2">
//             <FilePen /> Update InvoiceInvoice
//           </div>
//         ) : (
//           <div className="flex gap-2">
//             <FilePlus2 /> Generate Invoice
//           </div>
//         )}
//       </button>
//     </div>
//   </div>
// );

// export default MainContent;

import React, { useState } from "react";
import { FilePen, FilePlus2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import CustomerDetails from "./CustomerDetails";
import InvoiceDetails from "./InvoiceDetails";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";
import PaymentDetails from "./PaymentDetails";
import NoteField from "./NoteField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UPIPaymentCard } from "./InvoiceModal";

const MainContent = ({
  customerName,
  setCustomerName,
  customerNumber,
  setCustomerNumber,
  currentInvoiceId,
  getCurrentFormattedDate,
  setCurrentDate,
  handleSubmit,
  productName,
  setProductName,
  productQuantity,
  setProductQuantity,
  productPrice,
  setProductPrice,
  editingProduct,
  products,
  startEditing,
  deleteProduct,
  cash,
  setCash,
  upi,
  setUpi,
  credit,
  setCredit,
  handleDoubleClick,
  note,
  setNote,
  calculateTotal,
  isEditing,
  handleUpdateInvoice,
  handlePrint,
  allProducts,
}) => {
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [qrAmount, setQrAmount] = useState("");
  const [qrUpiLink, setQrUpiLink] = useState("");

  const generateUPILink = (amount) => {
    // Replace with your actual UPI ID
    const upiId = "your-upi-id@upi";
    return `upi://pay?pa=${upiId}&pn=Your%20Business%20Name&am=${amount}&cu=INR`;
  };

  return (
    <div className="flex-grow borde md:p-6 overflow-auto bg-gray-900 text-gray-100">
      {/* <h5 className="text-center font-bold bg-sky-500 text-white border border-sky-600 p-1.5 mb-4 rounded text-lg md:text-xl">
        Create Invoice
      </h5> */}
      <div className="flex justify-between items-center mb-4">
        <h5 className="font-bold bg-sky-500 text-white border border-sky-600 p-1.5 rounded text-lg md:text-xl">
          Create Invoice
        </h5>
        <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-black bg-white">
              Generate QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            {/* <div className="grid gap-4 py-4"> */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="amount"
                type="number"
                value={qrAmount}
                onChange={(e) => {
                  setQrAmount(e.target.value);
                  const upiLink = generateUPILink(e.target.value);
                  setQrUpiLink(upiLink);
                }}
                placeholder="Enter amount"
                className="col-span-3"
              />
              <Button
                onClick={() => {
                  const upiLink = generateUPILink(qrAmount);
                  setQrUpiLink(upiLink);
                }}
              >
                <QRCodeSVG />
              </Button>
            </div>
            <UPIPaymentCard
              upiLink={qrUpiLink}
              totalAmount={qrAmount}
              isVisible={!!qrUpiLink}
            />
            {/* </div> */}
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row w-full justify-between gap-4 md:gap-6">
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
      </div>

      <ProductForm
        handleSubmit={handleSubmit}
        productName={productName}
        setProductName={setProductName}
        productQuantity={productQuantity}
        setProductQuantity={setProductQuantity}
        productPrice={productPrice}
        setProductPrice={setProductPrice}
        editingProduct={editingProduct}
        products={allProducts}
      />

      <h5 className="text-lg font-semibold mb-2 text-sky-500">
        {editingProduct !== null ? "Edit Product" : "Add Product"}
      </h5>

      <ProductTable
        products={products}
        startEditing={startEditing}
        deleteProduct={deleteProduct}
      />

      <div className="text-right font-bold text-sky-500 text-lg md:text-xl mt-4">
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

      <div className="mt-5 text-right sticky bottom-16 right-4 md:bottom-8 md:right-10">
        <button
          type="button"
          className={`bg-${
            isEditing ? "yellow" : "red"
          }-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-${
            isEditing ? "yellow" : "red"
          }-600 transition-colors text-sm md:text-base`}
          onClick={isEditing ? handleUpdateInvoice : handlePrint}
        >
          {isEditing ? (
            <div className="flex items-center gap-2">
              <FilePen className="w-4 h-4 md:w-5 md:h-5" /> Update Invoice
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FilePlus2 className="w-4 h-4 md:w-5 md:h-5" /> Generate Invoice
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default MainContent;
