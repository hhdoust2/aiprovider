const CACHE_NAME = 'api-manager-v2'; // هر بار تغییر مهمی دادید، این عدد رو افزایش بدید
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700&display=swap'
];

// نصب سرویس ورکر و ذخیره فایل‌ها در Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// فعال‌سازی و پاک‌سازی کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// پاسخگویی به درخواست‌ها
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // فقط درخواست‌های GET رو کنترل کن؛ درخواست‌های POST (مثل چت/API) همیشه مستقیم
  // به شبکه برن، چون Cache API اصلاً برای متدهای غیر GET طراحی نشده.
  if (req.method !== 'GET') {
    return; // بدون respondWith، مرورگر خودش مستقیم fetch رو انجام می‌ده
  }

  // برای ناوبری (باز کردن صفحه) و خود index.html: همیشه اول شبکه رو امتحان کن
  // تا آخرین نسخه رو بگیری؛ فقط اگر آفلاین بودی، از کش استفاده کن.
  // این دقیقاً همون چیزیه که قبلاً نبود و باعث می‌شد نسخه‌ی قدیمی همیشه سرو بشه.
  const isHTMLRequest = req.mode === 'navigate' || req.url.endsWith('/index.html') || req.url.endsWith('/');

  if (isHTMLRequest) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return networkResponse;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // برای بقیه‌ی فایل‌های ثابت (فونت، CSS، آیکون): همون کش-اول قبلی برای سرعت بیشتر
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      return cachedResponse || fetch(req);
    })
  );
});
