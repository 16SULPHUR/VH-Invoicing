self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const badge = typeof data.badge === "number" ? data.badge : null;

  const tasks = [
    self.registration.showNotification(data.title || "Variety Heaven", {
      body: data.body || "",
      icon: "/android-chrome-192x192.png",
      tag: data.tag || "close-day",
      data: { url: data.url || "/cashbook" },
    }),
  ];
  if (badge !== null && self.navigator.setAppBadge) {
    tasks.push(badge > 0 ? self.navigator.setAppBadge(badge) : self.navigator.clearAppBadge());
  }
  event.waitUntil(Promise.all(tasks));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => "focus" in client);
      if (open) return open.focus().then((client) => client.navigate?.(url));
      return self.clients.openWindow(url);
    })
  );
});
