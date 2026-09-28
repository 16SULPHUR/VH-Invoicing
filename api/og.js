import { ImageResponse } from "@vercel/og";
import { bricolage, bricolageExt, hanken400, hanken700 } from "./_lib/fonts.js";
import { billDate, billLines, codeFrom, fetchBill, firstName, lineAmount, rupees, shopName } from "./_lib/bill.js";


const INK = "#1e1a3a";
const INDIGO = "#231a47";
const INDIGO_RAISED = "#33296b";
const RANI = "#d6247a";
const MARIGOLD = "#f5a524";
const PAPER = "#fbf7ee";
const MUTED = "#6d6784";
const MAX_ROWS = 4;
const DISPLAY = "Bricolage, BricolageExt";
const BODY = "Hanken, BricolageExt";

const decode = (base64) => Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer;

let fonts;
const loadFonts = () =>
  (fonts ??= [
    { name: "Bricolage", weight: 800, style: "normal", data: decode(bricolage) },
    { name: "BricolageExt", weight: 800, style: "normal", data: decode(bricolageExt) },
    { name: "Hanken", weight: 400, style: "normal", data: decode(hanken400) },
    { name: "Hanken", weight: 700, style: "normal", data: decode(hanken700) },
  ]);

const h = (type, style, ...children) => ({ type, props: { style, children: children.flat().filter((c) => c !== null && c !== false) } });
const div = (style, ...children) => h("div", { display: "flex", ...style }, ...children);

const motif = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="24"><defs><pattern id="m" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${INDIGO_RAISED}"/><circle cx="6" cy="12" r="4" fill="${MARIGOLD}"/><path d="M14 22 L22 2" stroke="${RANI}" stroke-width="4"/></pattern></defs><rect width="1200" height="24" fill="url(#m)"/></svg>`
)}`;

function Wordmark(name, size) {
  const [first, ...rest] = name.split(" ");
  return div(
    { flexDirection: "column", fontFamily: DISPLAY, fontSize: size, lineHeight: 0.92, letterSpacing: -2, color: "white" },
    div({}, first),
    rest.length > 0 ? div({ color: MARIGOLD }, rest.join(" ")) : null
  );
}

const Band = () => ({ type: "img", props: { src: motif, width: 1200, height: 24 } });

const Page = (...children) =>
  div({ width: 1200, height: 630, flexDirection: "column", background: PAPER, fontFamily: BODY, color: INK }, Band(), div({ flex: 1 }, ...children));

function shopCard(name, tagline) {
  return Page(
    div(
      { flex: 1, background: INDIGO, padding: "70px 80px", flexDirection: "column", justifyContent: "space-between" },
      Wordmark(name, 150),
      div(
        { justifyContent: "space-between", alignItems: "flex-end", color: "#cfc8f0", fontSize: 34 },
        div({}, tagline || "Drape Yourself in Luxury"),
        div({ fontFamily: DISPLAY, color: "white", fontSize: 30, padding: "12px 26px", borderRadius: 40, background: RANI }, "Billing app")
      )
    )
  );
}

function billCard(data) {
  const name = shopName(data);
  const { bill } = data;
  const lines = billLines(bill);
  const shown = lines.slice(0, MAX_ROWS);
  const hidden = lines.length - shown.length;
  const due = Number(bill.credit) || 0;
  const greet = firstName(bill.customer_name);

  const slip = div(
    {
      width: 640,
      margin: "34px 0 0 56px",
      padding: "34px 40px 30px",
      flexDirection: "column",
      background: "white",
      borderRadius: 18,
      border: `2px solid #e6e0f2`,
      boxShadow: "0 18px 0 -6px #ece5d6",
      transform: "rotate(-1.4deg)",
    },
    div(
      { justifyContent: "space-between", alignItems: "baseline" },
      div({ fontFamily: DISPLAY, fontSize: 46, letterSpacing: -1 }, `Bill #${bill.id}`),
      div({ fontSize: 26, color: MUTED }, billDate(bill.date))
    ),
    greet ? div({ fontSize: 26, color: MUTED, marginTop: 4 }, `For ${greet}`) : null,
    div(
      { flexDirection: "column", marginTop: 22, borderTop: `3px dashed #d9d2e8`, paddingTop: 14 },
      shown.map((line) =>
        div(
          { justifyContent: "space-between", alignItems: "center", fontSize: 28, padding: "7px 0" },
          div(
            { maxWidth: 420, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
            `${line.name || "Item"}${Number(line.quantity) > 1 ? ` × ${line.quantity}` : ""}`
          ),
          div({ fontWeight: 700 }, rupees(lineAmount(line)))
        )
      ),
      hidden > 0 ? div({ fontSize: 24, color: MUTED, paddingTop: 4 }, `+ ${hidden} more item${hidden === 1 ? "" : "s"}`) : null
    ),
    div(
      { justifyContent: "space-between", alignItems: "baseline", marginTop: 18, borderTop: `3px solid ${INK}`, paddingTop: 14 },
      div({ fontSize: 26, fontWeight: 700, letterSpacing: 2 }, "TOTAL"),
      div({ fontFamily: DISPLAY, fontSize: 54 }, rupees(bill.total))
    )
  );

  const stamp =
    due > 0
      ? div(
          { flexDirection: "column", alignItems: "flex-start" },
          div({ fontSize: 26, color: "#cfc8f0", fontWeight: 700, letterSpacing: 2 }, "DUE ON THIS BILL"),
          div({ fontFamily: DISPLAY, fontSize: 84, color: "white", letterSpacing: -2 }, rupees(due)),
          div({ marginTop: 12, fontFamily: DISPLAY, fontSize: 30, color: "white", padding: "12px 26px", borderRadius: 40, background: RANI }, "Tap to pay by UPI")
        )
      : div(
          {
            fontFamily: DISPLAY,
            fontSize: 70,
            color: "#7ee0b0",
            border: "8px solid #7ee0b0",
            borderRadius: 22,
            padding: "4px 30px",
            transform: "rotate(-8deg)",
            letterSpacing: 4,
          },
          "PAID"
        );

  return Page(
    div({ width: 740, flexDirection: "column" }, slip),
    div(
      { flex: 1, background: INDIGO, padding: "56px 48px", flexDirection: "column", justifyContent: "space-between" },
      Wordmark(name, 66),
      stamp
    )
  );
}

export async function GET(request) {
  const code = codeFrom(request);
  const data = code ? await fetchBill(code) : null;
  const fonts = loadFonts();
  const tree = data?.bill ? billCard(data) : shopCard(shopName(data), data?.shop?.tagline);
  const image = new ImageResponse(tree, { width: 1200, height: 630, fonts });
  const headers = new Headers(image.headers);
  headers.set(
    "Cache-Control",
    data?.bill ? "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" : "public, max-age=86400, s-maxage=604800"
  );
  return new Response(image.body, { status: image.status, headers });
}
