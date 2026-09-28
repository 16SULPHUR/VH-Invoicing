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
  },
};
