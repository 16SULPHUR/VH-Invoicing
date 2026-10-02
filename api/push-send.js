import webpush from "web-push";
import { SUPABASE_URL } from "./_lib/publicEnv.js";

const DAY = 86_400_000;
const IST_OFFSET = 330 * 60_000;
const istDate = (daysAhead = 0) =>
  new Date(Date.now() + IST_OFFSET + daysAhead * DAY).toISOString().slice(0, 10);

const rupees = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

function customerKey(name, phone) {
  const digits = String(phone ?? "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `phone:${digits}` : `name:${String(name ?? "").trim().toLowerCase()}`;
}

async function rest(path, { method = "GET", key } = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`${path.split("?")[0]} failed with ${response.status}`);
  return method === "GET" ? response.json() : null;
}

async function dayIsClosed(key) {
  const [drawer] = await rest("cash_accounts?name=eq.SHOP&select=id", { key });
  if (!drawer) return false;
  const rows = await rest(
    `cash_reconciliations?account_id=eq.${drawer.id}&as_of_date=eq.${istDate(1)}&select=id`,
    { key }
  );
  return rows.length > 0;
}

async function dues(key) {
  const rows = await rest("invoices?credit=gt.0&select=customerName,customerNumber,credit", { key });
  const owed = new Map();
  for (const row of rows) {
    const id = customerKey(row.customerName, row.customerNumber);
    owed.set(id, (owed.get(id) ?? 0) + (Number(row.credit) || 0));
  }
  return { customers: owed.size, total: [...owed.values()].reduce((sum, value) => sum + value, 0) };
}

/** Vercel cron: sends the Close the day reminder unless the day is already closed. */
export async function GET(request) {
  const { CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY: key, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!CRON_SECRET || request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!key || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return Response.json({ error: "Push is not configured" }, { status: 503 });
  }

  const force = new URL(request.url).searchParams.has("force");
  if (!force && (await dayIsClosed(key))) return Response.json({ skipped: "day already closed" });

  const owed = await dues(key);
  const payload = JSON.stringify({
    title: "Time to close the day",
    body:
      owed.customers > 0
        ? `Count the drawer. ${owed.customers} customer${owed.customers === 1 ? "" : "s"} still owe ${rupees(owed.total)}.`
        : "Count the drawer and save today's closing.",
    badge: owed.customers,
    url: "/cashbook",
    tag: "close-day",
  });

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://pos.varietyheaven.in", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const subscriptions = await rest("push_subscriptions?select=endpoint,p256dh,auth", { key });

  let sent = 0;
  for (const { endpoint, p256dh, auth } of subscriptions) {
    try {
      await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, payload, { TTL: 3600 });
      sent += 1;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await rest(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE", key });
      }
    }
  }
  return Response.json({ sent, subscriptions: subscriptions.length });
}
