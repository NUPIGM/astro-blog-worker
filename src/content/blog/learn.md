---
title: "极简博客 PWA 开发教程"
description: "使用纯 HTML/JavaScript 构建一个具备离线访问、桌面安装和推送通知功能的博客系统。"
pubDate: "2025-01-01"
tags: ["PWA", "博客", "前端"]
---

# 极简博客 PWA 开发教程

本教程将指导你使用纯 **HTML/JavaScript** 构建一个具备离线访问、桌面安装和推送通知功能的博客系统。

## 1. 项目结构

在你的项目根目录下创建以下文件：

```text
my-pwa-blog/
├── index.html        # 博客主页（UI 与 逻辑）
├── manifest.json      # PWA 配置文件（决定安装效果）
├── sw.js             # Service Worker（处理缓存与离线）
├── icon-192.png       # 应用图标 (192x192)
└── icon-512.png       # 应用图标 (512x512)
```

---

## 2. service worker 核心代码实现

### 📄 index.html

#### 注册

注册是 Service Worker 生命周期的初始步骤：

```html
<!DOCTYPE html>
......
    <script>
      // 1. 注册 Service Worker
      // Don't register the service worker
      // until the page has fully loaded
      window.addEventListener("load", () => {
        // Is service worker available?
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker
            .register("/sw.js")
            .then(() => {
              console.log("Service worker registered!");
            })
            .catch((error) => {
              console.warn("Error registering service worker:");
              console.warn(error);
            });
        }
      });
    </script>
......
</html>
```

此代码在主线程上运行，并执行以下操作：

由于用户首次访问网站时没有注册 Service Worker，因此请等待网页完全加载完毕，然后再注册 Service Worker。这样做有助于避免在服务工件预缓存任何内容时出现带宽争用。
虽然 Service Worker 得到了良好的支持，但快速检查有助于避免在不支持 Service Worker 的浏览器中出现错误。
当页面完全加载后，如果支持 Service Worker，请注册 /sw.js。
以下是一些需要了解的关键事项：

Service Worker 仅通过 HTTPS 或 localhost 提供。
如果服务工件的代码包含语法错误，注册会失败，并且系统会舍弃该服务工件。
提醒：Service Worker 在某个作用域内运行。在这里，作用域是整个来源，因为它是从根目录加载的。
注册开始时，服务工件状态会设为 'installing'。
注册完成后，系统便会开始安装。

### 📄 sw.js

#### 安装

服务工件会在注册后触发其 install 事件。每个服务工件只会调用一次 install，并且在更新之前不会再次触发。您可以使用 addEventListener 在 worker 的作用域中注册 install 事件的回调：
Service Worker 是 PWA 的灵魂，负责拦截请求并管理缓存。

```javascript
// 安装阶段
self.addEventListener("install", (event) => {
  const CACHE_NAME = "application-v1.0.0"; // 更新版本号 - 每次修改都要递增
  const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
    "/db.js",
    "/message.html",
    "/offline.html", // 必须缓存回退页
  ];
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});
```

这会创建一个新的 Cache 实例并预缓存资源。 我们稍后有机会再讨论预缓存，因此现在我们先重点介绍 event.waitUntil 的作用。event.waitUntil 会接受一个 Promise，并等待该 Promise 解析完毕。在此示例中，该 promise 会执行两项异步操作：

创建一个名为 'MyFancyCache_v1' 的新 Cache 实例。
创建缓存后，系统会使用其异步 addAll 方法预缓存一组资源网址。
如果传递给 event.waitUntil 的 promise 被拒绝，安装将失败。如果发生这种情况，系统会舍弃该服务工件。

如果这些 Promise 解析，安装将成功，并且服务工件的状态将更改为 'installed'，然后激活。

#### 激活

如果注册和安装成功，服务工件会激活，其状态变为 'activating'。您可以在服务工件的 activate 事件中执行激活期间的工作。此事件中的典型任务是修剪旧缓存，但对于全新的服务工件，这目前并不相关，我们将在讨论服务工件更新时对此进行详细介绍。

对于新的服务工件，activate 会在 install 成功后立即触发。激活完成后，服务工件的状态变为 'activated'。请注意，默认情况下，新 Service Worker 不会在下次导航或页面刷新之前开始控制页面。

#### 在以下情况下，浏览器会检查服务工件的更新：

用户导航到 Service Worker 的范围内的网页。
使用与当前安装的服务工件不同的网址调用 navigator.serviceWorker.register()，但请勿更改服务工件的网址！
调用 navigator.serviceWorker.register() 时使用的网址与已安装的服务工件相同，但作用域不同。再次提醒，请尽可能将作用域保留在源的根目录中，以避免出现这种情况。
在过去 24 小时内触发了 'push' 或 'sync' 等事件，但暂时不用担心这些事件。

当浏览器导航到服务工件作用域内的新页面时，会自动执行更新检查。

手动触发更新检查
在这种情况下，可以在主线程中触发手动更新：

```javascript
navigator.serviceWorker.ready.then((registration) => {
  registration.update();
});
```

```javascript
const CACHE_NAME = "application-v2.0.0";
```

#### 与前面的第一个 install 事件示例相比，有两点不同：

系统会创建一个键为 'MyFancyCacheName_v2' 的新 Cache 实例。
预缓存的资源名称已更改。

请注意，更新后的服务工件会与之前的服务工件一起安装

#### 观察更新 "/index.html"

```javascript
navigator.serviceWorker.register("/sw.js").then((reg) => {
  reg.installing; // the installing worker, or undefined
  reg.waiting; // the waiting worker, or undefined
  reg.active; // the active worker, or undefined

  reg.addEventListener("updatefound", () => {
    // A wild service worker has appeared in reg.installing!
    const newWorker = reg.installing;

    newWorker.state;
    // "installing" - the install event has fired, but not yet complete
    // "installed"  - install complete
    // "activating" - the activate event has fired, but not yet complete
    // "activated"  - fully active
    // "redundant"  - discarded. Either failed install, or it's been
    //                replaced by a newer version

    newWorker.addEventListener("statechange", () => {
      // newWorker.state has changed
    });
  });
});

navigator.serviceWorker.addEventListener("controllerchange", () => {
  // This fires when the service worker controlling this page
  // changes, eg a new worker has skipped waiting and become
  // the new active worker.
});
```

caches.match(event.request)：检查请求是否在缓存中。
如果缓存命中：立即返回缓存的响应，提升加载速度。
如果缓存未命中：发起正常的网络请求 fetch(event.request)。

```javascript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // 缓存命中，直接返回
      }
      // 缓存未命中，从网络请求
      return fetch(event.request);
    }),
  );
});
```

```js
// 清理所有缓存
caches.keys().then((names) => {
  names.forEach((name) => {
    caches.delete(name);
  });
});

// 或清理特定缓存
caches.delete("old-cache-name");
```

#### 过时重新验证

第一次请求资源时，从网络中提取资源 将其放在缓存中，并返回网络响应。

对于后续请求，先从缓存中提供资源，然后再“在后台”提供资源， 从网络重新请求该资产并更新资产的缓存条目。

在此日期之后再提交请求 您将收到从网络提取的最后一个版本（在上一步中放入缓存）。

```javascript
// Establish a cache name
const cacheName = "MyFancyCacheName_v1";

self.addEventListener("fetch", (event) => {
  if (event.request.destination === "image") {
    event.respondWith(
      caches.open(cacheName).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then(
            (networkResponse) => {
              cache.put(event.request, networkResponse.clone());

              return networkResponse;
            },
          );

          return cachedResponse || fetchedResponse;
        });
      }),
    );
  } else {
    return;
  }
});
```

---

#### 设置 Clear-Site-Data 标头

如果发生以下情况，某些浏览器将取消注册某个源的所有 Service Worker： 已设置值为 'storage' 的 Clear-Site-Data 响应标头。 不过，使用此方法需要注意以下几点：

请注意，此操作会清除关联源的所有存储空间。这包括 localStorage、IndexedDB、sessionStorage 和其他存储空间（但不包括源的 HTTP 缓存）。
并非所有浏览器都支持此标头。

#### 导航预加载

导航预加载是“提前发起网络请求，减少等待”；
普通缓存策略是“已有缓存就直接用，减少网络请求”。
两者可以结合使用：导航预加载加速页面加载，缓存策略保障后续请求更快、更稳定。

```js
addEventListener("activate", (event) => {
  event.waitUntil(
    (async function () {
      // Feature-detect
      if (self.registration.navigationPreload) {
        // Enable navigation preloads!
        await self.registration.navigationPreload.enable();
      }
    })(),
  );
});

addEventListener("fetch", (event) => {
  event.respondWith(
    (async function () {
      // Respond from the cache if we can
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;

      // Else, use the preloaded response, if it's there
      const response = await event.preloadResponse;
      if (response) return response;

      // Else try the network.
      return fetch(event.request);
    })(),
  );
});
```

## 1. 结构化存储：IndexedDB 数据库

为了存储成千上万篇文章并支持高效检索，我们使用浏览器内置的 `IndexedDB`。

### 📄 db.js (数据库管理)

```javascript
const DB_NAME = "BlogDB";
const DB_VERSION = 1;

const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("posts")) {
      db.createObjectStore("posts", { keyPath: "id" });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

// 保存文章
async function savePostsToDB(posts) {
  const db = await dbPromise;
  const tx = db.transaction("posts", "readwrite");
  const store = tx.objectStore("posts");
  posts.forEach((post) => store.put(post));
}

// 读取文章
async function getAllPostsFromDB() {
  const db = await dbPromise;
  return new Promise((resolve) => {
    const tx = db.transaction("posts", "readonly");
    const store = tx.objectStore("posts").getAll();
    store.onsuccess = () => resolve(store.result);
  });
}
```

---

### 📄 offline.html (离线提示页)

```html
<body>
  <h1>📡 你目前处于离线状态</h1>
  <p>该内容尚未缓存，请检查网络后重试。</p>
  <button onclick="window.location.href='index.html'">返回首页</button>
</body>
```

---

## 5. 如何验证进阶功能

1.  **检查数据库**：DevTools -> Application -> IndexedDB -> BlogDB。
2.  **验证动态缓存**：点击一个新资源，断网后刷新，看它是否依然存在。
3.  **观察骨架屏**：在 Network 面板限制网速为 "Slow 3G" 即可看到加载动画。
4.  **触发离线页**：完全断网后访问一个从未打开过的伪造 URL。

---
