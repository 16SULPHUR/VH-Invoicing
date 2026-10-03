import webpush from "web-push";
import { SUPABASE_URL } from "./_lib/publicEnv.js";

const DAY = 86_400_000;
const IST_OFFSET = 330 * 60_000;
const SOON_DAYS = 3;
const istDate = (daysAhead = 0) =>
  new Date(Date.now() + IST_OFFSET + daysAhead * DAY).toISOString().slice(0, 10);

const rupees = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

async function rest(path, { method = "GET", key } = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`${path.split("?")[0]} failed with ${response.status}`);
  return method === "GET" ? response.json() : null;
}

/** Vercel cron: morning reminder of supplier bills that are overdue or due within three days. */
export async function GET(request) {
  const { CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY: key, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!CRON_SECRET || request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!key || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return Response.json({ error: "Push is not configured" }, { status: 503 });
  }

  const horizon = istDate(SOON_DAYS);
  const today = istDate();
  const [bills, payments] = await Promise.all([
    rest(`supplier_bills?due_date=lte.${horizon}&select=id,total,due_date`, { key }),
    rest("supplier_payments?select=bill_id,amount", { key }),
  ]);

  const settled = new Map();
  for (const { bill_id, amount } of payments) settled.set(bill_id, (settled.get(bill_id) ?? 0) + Number(amount));

  let overdue = 0;
  let soon = 0;
  let overdueCount = 0;
  let soonCount = 0;
  for (const bill of bills) {
    const left = Number(bill.total) - (settled.get(bill.id) ?? 0);
    if (left <= 0) continue;
    if (bill.due_date < today) {
      overdue += left;
      overdueCount += 1;
    } else {
      soon += left;
      soonCount += 1;
    }
  }
  if (overdueCount + soonCount === 0) return Response.json({ skipped: "nothing due" });

  const parts = [];
  if (overdueCount) parts.push(`${overdueCount} overdue (${rupees(overdue)})`);
  if (soonCount) parts.push(`${soonCount} due within ${SOON_DAYS} days (${rupees(soon)})`);
  const payload = JSON.stringify({
    title: "Supplier payments due",
    body: parts.join(", "),
    url: "/suppliers",
    tag: "supplier-due",
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
