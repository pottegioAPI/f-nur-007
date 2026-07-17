// Service worker สำหรับ F-NUR-007
// เป้าหมาย: เปิดใช้งานได้เมื่อไม่มีเน็ต หลังจากโหลดครั้งแรกแล้ว
// เวลาแก้ index.html ให้เปลี่ยนเลขเวอร์ชันด้านล่าง ไม่งั้นเครื่องพยาบาลจะยังใช้ของเก่าที่แคชไว้

const CACHE = 'fnur007-v19';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // การเปิดหน้าเว็บ: ลองเน็ตก่อนเพื่อให้ได้เวอร์ชันใหม่ ถ้าไม่มีเน็ตค่อยใช้ของในแคช
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ไฟล์อื่น (ไอคอน/manifest): ใช้ของในแคชก่อน เร็วกว่าและออฟไลน์ได้
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req))
  );
});
