import React from "react";

export const UpdatedVarietyHeavenInvoice = ({
  customerName,
  customerContact,
  invoiceId,
  invoiceDate,
  products,
  calculateTotal,
  note,
}) => {
  const formatCurrency = (amount) => `₹ ${parseFloat(amount).toFixed(2)}`;

  const total = calculateTotal();
  const subTotal = total;
  const grandTotal = subTotal;

  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      width: "148mm", // A5 width
      height: "210mm", // A5 height
      margin: "auto",
      padding: "5mm",
      fontSize: "16px", // Doubled base font size
      border: "1px solid #000",
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
      width: "120px", // Same logo size
    },
    companyDetails: {
      margin: "0",
      fontSize: "14px", // Doubled font for company details
    },
    invoiceTitle: {
      backgroundColor: "#e8f5e9",
      padding: "2mm",
      textAlign: "center",
      marginBottom: "3mm",
      border: "1px solid #000",
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
      fontSize: "16px", // Doubled font for table headers
    },
    td: {
      border: "1px solid #000",
      padding: "2mm",
      fontSize: "16px", // Doubled font for table data
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: "0", fontSize: "24px" }}>VARIETY HEAVEN</h1>
          <p style={styles.companyDetails}>
            Shop no. 09, Sentosa Enclave, Near Ramipark soc.,
          </p>
          <p style={styles.companyDetails}>Dindoli, Surat. PIN: 394-210</p>
          <p style={styles.companyDetails}>Phone No.: 8160185875, 7990057097</p>
          <p style={styles.companyDetails}>Email ID: supatil1975@gmail.com</p>
          <p style={styles.companyDetails}>GSTIN: 24GGEPP0013E1ZZ</p>
          <p style={styles.companyDetails}>State: Gujarat</p>
        </div>
        <img
          src="https://ik.imagekit.io/dqn1rnabh/logo-vh.png?updatedAt=1726645373505"
          alt="Variety Heaven Logo"
          style={styles.logo}
        />
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
        <div style={{ border: "1px solid #000", padding: "2mm", width: "48%" }}>
          <h3 style={{ margin: "0 0 2mm 0", fontSize: "18px" }}>Bill To:</h3>
          <p style={{ margin: "1mm 0" }}>Name: {customerName}</p>
          <p style={{ margin: "1mm 0" }}>Contact No.: {customerContact}</p>
        </div>
        <div style={{ border: "1px solid #000", padding: "2mm", width: "48%" }}>
          <p style={{ margin: "1mm 0" }}>
            <strong>Invoice No:</strong> {invoiceId}
          </p>
          <p style={{ margin: "1mm 0" }}>
            <strong>Date:</strong> {invoiceDate}
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
          <h3 style={{ margin: "0 0 2mm 0", fontSize: "14px" }}>
            TERMS AND CONDITIONS:
          </h3>
          <ol style={{ margin: "0", fontSize: "12px" }}>
            <li>Goods once sold will not taken back.</li>
            <li>Exchange timing is from 4:00 PM to 6:00 PM.</li>
            <li>No guarantee for color and zari quality.</li>
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
          <p
            style={{
              marginTop: "15mm",
              borderTop: "1px solid #000",
              paddingTop: "2mm",
              fontSize: "16px",
            }}
          >
            For Variety Heaven
          </p>
        </div>
      </div>
      {note && (
        <div style={{ marginTop: "10mm", border: "1px solid #000", padding: "2mm" }}>
          <h3 style={{ margin: "0", fontSize: "14px" }}>Note:</h3>
          <p style={{ fontSize: "12px" }}>{note}</p>
        </div>
      )}
    </div>
  );
};
