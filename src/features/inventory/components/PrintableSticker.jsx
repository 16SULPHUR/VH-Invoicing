import Barcode from "react-barcode";
import { BUSINESS } from "@/config/business";

const STICKER_STYLES = {
  sticker: {
    width: "50.8mm",
    height: "25.4mm",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "2mm",
    fontFamily: "monospace",
    backgroundColor: "white",
    color: "black",
    padding: "0mm",
    margin: "0mm",
    border: "0.1mm solid black",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: "0mm 3mm",
  },
  headerText: { fontSize: "12px", fontWeight: "bold", margin: 0 },
  price: {
    fontSize: "20px",
    fontWeight: "bolder",
    margin: "0mm",
    transform: "rotate(270deg)",
  },
};

export function PrintableSticker({ sku, price, barcode }) {
  return (
    <div id="sticker" style={STICKER_STYLES.sticker}>
      <div style={STICKER_STYLES.header}>
        <span style={STICKER_STYLES.headerText}>{BUSINESS.name}</span>
        <span style={STICKER_STYLES.headerText}>{sku}</span>
      </div>
      <div className="flex w-full justify-between">
        <Barcode
          value={String(barcode)}
          height={50}
          width={1.2}
          fontSize={10}
          textMargin={0}
          margin={0}
          marginLeft={5}
        />
        <span style={STICKER_STYLES.price}>₹{price}</span>
      </div>
    </div>
  );
}
