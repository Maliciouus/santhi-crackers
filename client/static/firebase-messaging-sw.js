// console.log('Service worker starting');

// const CACHE_NAME = 'firebase-messaging-v1';

// self.addEventListener('install', (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then(cache => console.log('Cache opened'))
//       .catch(err => console.error('Cache error:', err))
//   );
// });

// // Load Firebase scripts
// try {
//   importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
//   importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

//   firebase.initializeApp({
//     apiKey: 'AIzaSyDxkpAyYjGS_jC3abTHDfdAVozeUR_MKiU',
//     authDomain: 'ecommerce-76923.firebaseapp.com',
//     projectId: 'ecommerce-76923',
//     storageBucket: 'ecommerce-76923.firebasestorage.app',
//     messagingSenderId: '1075564064831',
//     appId: '1:1075564064831:web:0e28c69c564ba6e9d4888a',
//     measurementId: 'G-ZSPBRZFZ6N'
//   });

//   const messaging = firebase.messaging();

//   messaging.onBackgroundMessage((payload) => {
//     console.log('[SW] Background message:', payload);
//     const notificationTitle = payload.notification?.title || 'New Message';
//     const notificationOptions = {
//       body: payload.notification?.body || '',
//       icon: '/favicon1.png',
//       data: payload.data || {}
//     };
//     return self.registration.showNotification(notificationTitle, notificationOptions);
//   });

//   self.addEventListener('notificationclick', (event) => {
//     event.notification.close();
//     const url = event.notification.data?.url || '/';
//     event.waitUntil(
//       clients.matchAll({type: 'window'})
//         .then(clients => {
//           const client = clients.find(c => c.url === url);
//           return client ? client.focus() : clients.openWindow(url);
//         })
//     );
//   });

// } catch (error) {
//   console.error('Service worker error:', error);
// }

importScripts('https://www.gstatic.com/firebasejs/10.3.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.3.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "XXXX",
  authDomain: "XXXX.firebaseapp.com",
  projectId: "XXXX",
  storageBucket: "XXXX.appspot.com",
  messagingSenderId: "XXXX",
  appId: "1:XXXX:web:XXXX"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
