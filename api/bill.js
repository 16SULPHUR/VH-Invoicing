import { billLines, codeFrom, fetchBill, firstName, rupees, shopName } from "./_lib/bill.js";


const escape = (text) =>
  String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function describe(data) {
  const { bill } = data;
  const count = billLines(bill).reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  const due = Number(bill.credit) || 0;
  const greet = firstName(bill.customer_name);
  const title = `Bill #${bill.id} · ${rupees(bill.total)} · ${shopName(data)}`;
  const parts = [
    greet ? `${greet}'s bill` : "Your bill",
    `${count} item${count === 1 ? "" : "s"}`,
    due > 0 ? `${rupees(due)} due. Tap to pay by UPI` : "Paid in full. Thank you!",
  ];
  return { title, description: parts.join(" · "), version: `${bill.total}-${due}` };
}

function metaTags({ title, description, url, image }) {
  return [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    `<meta name="robots" content="noindex, nofollow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    `<meta property="og:image" content="${escape(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escape(title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join("\n    ");
}

/** Link-preview bots get the bill's title and image; people are served the app by vercel.json. */
export async function GET(request) {
  const origin = new URL(request.url).origin;
  const code = codeFrom(request);
  const data = await fetchBill(code);
  const meta = data?.bill
    ? describe(data)
    : { title: shopName(data), description: "This bill link is not valid.", version: "0" };
  const url = `${origin}/b/${code ?? ""}`;
  const tags = metaTags({
    ...meta,
    url,
    image: `${origin}/api/og?code=${code ?? ""}&v=${encodeURIComponent(meta.version)}`,
  });
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${tags}
  </head>
  <body>
    <p><a href="${escape(url)}">${escape(meta.title)}</a></p>
    <p>${escape(meta.description)}</p>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=60",
      "X-Robots-Tag": "noindex",
    },
  });
}
