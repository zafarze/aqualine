// AquaLine CRM · Service Worker
const CACHE = "aqualine-crm-v2";
const PRECACHE = ["/offline.html", "/manifest.json", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) return; // API всегда напрямую

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (c) =>
        c ||
        fetch(request).then((res) => {
          if (request.method === "GET" && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cc) => cc.put(request, clone));
          }
          return res;
        })
    )
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "AquaLine CRM", body: "Новое уведомление" };
  try { if (event.data) data = event.data.json(); }
  catch { if (event.data) data.body = event.data.text(); }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
      tag: data.tag || "aqualine-crm",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((wins) => {
      for (const w of wins) if (w.url.includes(url) && "focus" in w) return w.focus();
      return self.clients.openWindow(url);
    })
  );
});
