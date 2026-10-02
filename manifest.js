export const manifestForPlugIn = {
  registerType: "prompt",
  includeAssets: ["favicon.ico", "apple-touch-icon.png"],
  manifest: {
    id: "/",
    name: "Variety Heaven",
    short_name: "Variety Heaven",
    description: "Billing, stock, customers and accounts for Variety Heaven",
    lang: "en-IN",
    categories: ["business", "finance", "shopping"],
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/maskable_icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New bill", short_name: "Bill", url: "/", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }] },
      { name: "Scan", url: "/scan", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }] },
      { name: "Customers and dues", short_name: "Customers", url: "/customers", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }] },
      { name: "WhatsApp", url: "/whatsapp", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }] },
    ],
    screenshots: [
      { src: "/screenshots/dues.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Dues by customer, with one-tap reminders" },
      { src: "/screenshots/customer.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Every bill, payment and read receipt in one place" },
      { src: "/screenshots/dues-wide.png", sizes: "1600x900", type: "image/png", form_factor: "wide", label: "Everything on one big screen" },
    ],
    theme_color: "#231a47",
    background_color: "#f9f8fd",
    display: "standalone",
    scope: "/",
    start_url: "/",
    orientation: "portrait",
  },
  workbox: {
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    navigateFallbackDenylist: [/^\/api\//],
    importScripts: ["push-sw.js"],
  },
};
