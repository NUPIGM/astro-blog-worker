const CACHE_NAME = "application-v1.0.5"; // 更新版本号 - 每次修改都要递增
// 安装阶段
self.addEventListener("install", (event) => {
  const ASSETS_TO_CACHE = ["/about", "/index"];
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      // 缓存命中，直接返回
      if (cachedResponse) return cachedResponse;
      // 导航预加载
      const response = await event.preloadResponse;
      if (response) return response;
      // 缓存未命中，从网络请求
      return fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter((name) => name !== CACHE_NAME);
      await Promise.all(oldCaches.map((name) => caches.delete(name)));
      if (self.registration.navigationPreload) {
        self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});
