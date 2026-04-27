// sw.js — Service Worker con soporte FCM para notificaciones push
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const CACHE = 'dg-pwa-v2';

firebase.initializeApp({
  apiKey: "AIzaSyDt4Xjuo1H8kfBgpN0vyTPIlOwdyp5g7Dc",
  authDomain: "diagrama-537aa.firebaseapp.com",
  projectId: "diagrama-537aa",
  storageBucket: "diagrama-537aa.firebasestorage.app",
  messagingSenderId: "1039943615847",
  appId: "1:1039943615847:web:d0e53d4275302c839cdbc2"
});

const messaging = firebase.messaging();

// Notificación cuando la app está en SEGUNDO PLANO o CERRADA
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || '📋 Nueva licencia', {
    body: body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: self.location.origin },
  });
});

// Al tocar la notificación → abrir la app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const existing = cs.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(self.location.origin);
    })
  );
});

// Cache offline
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/'])));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.url.includes('firebase') || e.request.url.includes('googleapis')) return;
  e.respondWith(fetch(e.request).then(res=>{
    if(res.ok&&e.request.method==='GET'){const clone=res.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}
    return res;
  }).catch(()=>caches.match(e.request)));
});
