import { supabase, unwrap } from "@/lib/supabase";

const supported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function keyBytes(base64Url) {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

async function publicKey() {
  const response = await fetch("/api/push-key");
  if (!response.ok) return null;
  return (await response.json()).key || null;
}

export const pushService = {
  supported,

  async isOn() {
    if (!supported() || Notification.permission !== "granted") return false;
    return Boolean(await currentSubscription());
  },

  async enable() {
    if (!supported()) throw new Error("This browser cannot show reminders.");
    const key = await publicKey();
    if (!key) throw new Error("Reminders are not set up on the server yet.");
    if ((await Notification.requestPermission()) !== "granted") {
      throw new Error("Notifications are blocked. Allow them in the browser settings.");
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(key),
      }));
    const { endpoint, keys } = subscription.toJSON();
    unwrap(
      await supabase.from("push_subscriptions").upsert({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: navigator.userAgent.slice(0, 200),
      })
    );
  },

  async disable() {
    const subscription = await currentSubscription();
    if (!subscription) return;
    unwrap(await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint));
    await subscription.unsubscribe();
  },
};
