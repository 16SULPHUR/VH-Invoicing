import { Instagram } from "lucide-react";
import React from "react";
import { QRCodeSVG } from "qrcode.react";

export const UpdatedVarietyHeavenInvoice = ({
  customerName,
  customerContact,
  invoiceId,
  invoiceDate,
  products,
  calculateTotal,
  note,
  cash,
}) => {
  const formatCurrency = (amount) => `₹ ${parseFloat(amount).toFixed(2)}`;
  function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const total = calculateTotal();
  const subTotal = total;
  const grandTotal = subTotal;

  const upiLink = `upi://pay?pa=gpay-11240439077@okbizaxis&mc=5411&pn=Variety heaven&am=${grandTotal}&tr=1240439077&cu=INR`;

  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      width: "148mm",
      height: "210mm",
      margin: "auto",
      padding: "5mm",
      fontSize: "16px",
      border: "1px solid #000",
      backgroundImage: "url('invoiceBG.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "5mm",
      borderBottom: "1px solid #000",
      paddingBottom: "3mm",
    },
    logo: {
      width: "120px",
    },
    companyDetails: {
      margin: "0",
      fontSize: "12px",
    },
    invoiceTitle: {
      backgroundColor: "#e8f5e9",
      padding: "2mm",
      textAlign: "center",
      marginBottom: "3mm",
      border: "1px solid #000",
      fontSize: "14px",
    },
    section: {
      marginBottom: "3mm",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "3mm",
    },
    th: {
      backgroundColor: "#e8f5e9",
      border: "1px solid #000",
      padding: "2mm",
      textAlign: "left",
      fontSize: "14px",
    },
    td: {
      border: "1px solid #000",
      padding: "2mm",
      fontSize: "14px",
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
    },
    socialContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "0.25rem",
    },
    socialHandle: {
      display: "flex",
      fontSize: "0.875rem",
      gap: "0.5rem",
      alignItems: "center",
    },
    socialText: {
      fontWeight: "600",
    },
    whatsappQR: {
      width: "6rem",
    },
    logoImage: {
      width: "10rem",
    },
    signImage: {
      width: "8rem",
      margin: "0px 3rem",
      mixBlendMode: "burn",
    },
    termsContainer: {
      margin: "0",
      fontSize: "0.75rem",
      paddingLeft: "1.25rem",
    },
    noteTitle: {
      margin: "0",
      fontSize: "0.875rem",
    },
    noteText: {
      fontSize: "0.75rem",
    },
    paymentQRContainer: {
      // display: "flex",
      // justifyContent: "start",
      // alignItems: "start",
      // flexDirection: "column",
      marginTop: "3mm",
    },
    paymentQRTitle: {
      fontSize: "12px",
      fontWeight: "bold",
      marginBottom: "2mm",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: "0", fontSize: "24px" }}>
            <img src="vh-horizontal.png" alt="logo" style={styles.logoImage} />
          </h1>
          <p style={styles.companyDetails}>
            Shop no. 09, Sentosa Enclave, Near Ramipark soc., Dindoli, Surat,
            Gujarat. PIN: 394-210
          </p>
          <p style={styles.companyDetails}>Phone No.: 8160185875, 7990057097</p>
          <p style={styles.companyDetails}>GSTIN: 24GGEPP0013E1ZZ</p>
        </div>
        <div style={styles.socialContainer}>
          <div style={styles.socialHandle}>
            <Instagram size={20} />
            <span style={styles.socialText}>@varietyheaven.in</span>
          </div>
          <div>
            <img
              src="/whatsappQR.png"
              alt="whatsapp qr"
              style={styles.whatsappQR}
            />
          </div>
        </div>
      </div>

      <div style={styles.invoiceTitle}>
        <h2 style={{ margin: "0", fontSize: "20px" }}>Invoice</h2>
      </div>

      <div
        style={{
          ...styles.section,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            border: "1px solid #000",
            padding: "2mm",
            width: "48%",
            fontSize: "14px",
          }}
        >
          <h3 style={{ margin: "0 0 2mm 0", fontSize: "14px" }}>Bill To:</h3>
          <p style={{ margin: "1mm 0" }}>Name: {customerName}</p>
          {customerContact && (
            <p style={{ margin: "1mm 0" }}>Contact No.: {customerContact}</p>
          )}
        </div>
        <div style={{ border: "1px solid #000", padding: "2mm", width: "48%" }}>
          <p style={{ margin: "1mm 0" }}>
            <strong>Invoice No:</strong> {invoiceId}
          </p>
          <p style={{ margin: "1mm 0" }}>
            <strong>Date:</strong> {formatDate(invoiceDate)}
          </p>
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>S.N.</th>
            <th style={styles.th}>Item name</th>
            <th style={styles.th}>Quantity</th>
            <th style={styles.th}>Price/Unit</th>
            <th style={styles.th}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index}>
              <td style={styles.td}>{index + 1}</td>
              <td style={styles.td}>{product.name}</td>
              <td style={styles.td}>{product.quantity}</td>
              <td style={styles.td}>{formatCurrency(product.price)}</td>
              <td style={styles.td}>{formatCurrency(product.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan="4"
              style={{ ...styles.td, textAlign: "right", fontWeight: "bold" }}
            >
              Total:
            </td>
            <td style={{ ...styles.td, fontWeight: "bold" }}>
              {formatCurrency(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style={styles.footer}>
        <div style={{ width: "48%", border: "1px solid #000", padding: "2mm" }}>
          <h3 style={styles.noteTitle}>TERMS AND CONDITIONS:</h3>
          <ol style={styles.termsContainer}>
            <li>Goods once sold will not taken back.</li>
            <li>Exchange timing is from 4:00 PM to 6:00 PM.</li>
            <li>No guarantee for color and zari quality.</li>
            <li>Goods should be returned within 4 days.</li>
            <li>Subject to Surat jurisdiction only.</li>
          </ol>
        </div>
        <div
          style={{
            width: "48%",
            textAlign: "center",
            border: "1px solid #000",
            padding: "2mm",
          }}
        >
          <p style={{ margin: "0", fontSize: "12px" }}>
            For Variety Heaven
            <div style={{ margin: "0", fontSize: "14px" }}>
              <img src="sign.svg" alt="logo" style={styles.signImage} />
            </div>
            Authorized Signatory
          </p>
        </div>
      </div>
      <div style={styles.paymentQRContainer}>
        <p style={styles.paymentQRTitle}>Scan to Pay</p>
        <QRCodeSVG value={upiLink} size={100} />
      </div>
      {note && (
        <div
          style={{
            marginTop: "10mm",
            border: "1px solid #000",
            padding: "2mm",
          }}
        >
          <h3 style={styles.noteTitle}>Note:</h3>
          <p style={styles.noteText}>{note}</p>
        </div>
      )}
    </div>
  );
};

export default UpdatedVarietyHeavenInvoice;
