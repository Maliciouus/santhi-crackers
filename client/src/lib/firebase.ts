import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { _axios } from '$lib/_axios';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDxkpAyYjGS_jC3abTHDfdAVozeUR_MKiU',
  authDomain: 'ecommerce-76923.firebaseapp.com',
  projectId: 'ecommerce-76923',
  storageBucket: 'ecommerce-76923.firebasestorage.app',
  messagingSenderId: '1075564064831',
  appId: '1:1075564064831:web:0e28c69c564ba6e9d4888a',
  measurementId: 'G-ZSPBRZFZ6N',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const db = getFirestore(app);

// Store processed notification IDs in memory
const processedNotifications = new Set();

// Safari-specific function to request notification permission
async function requestSafariNotificationPermission() {
  if (typeof window !== 'undefined' && (window as any).safari) {
    try {
      console.log('Requesting Safari notification permission');
      const permission = await Notification.requestPermission();
      console.log('Safari permission result:', permission);
      if (permission !== 'granted') {
        console.warn('Notification permission denied in Safari');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting notification permission in Safari:', error);
      return false;
    }
  }
  return true;
}

export const requestForToken = async () => {
  console.log('requestForToken called');
  try {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    // Request permission with Safari-specific handling
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let permissionGranted = false;

    if (isSafari) {
      permissionGranted = await requestSafariNotificationPermission();
    } else {
      console.log('Requesting notification permission (non-Safari)');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      permissionGranted = permission === 'granted';
    }

    if (!permissionGranted) {
      console.warn('Notification permission denied');
      return null;
    }

    // Register service worker
    console.log('Registering service worker');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      // Removed type: 'module' as it's not strictly required for Safari web push
    });
    console.log('Service Worker registered:', registration);

    // Get FCM token
    console.log('Getting FCM token');
    const currentToken = await getToken(messaging, {
      vapidKey: 'BD5H8_0fUg5f9y02BhTZigHiPI0ifwrHiaoFlL-uxZpzzEnaW1yIoMNWvkodVau7hMwVsUpAeWNq7is9T-bTvqE',
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      console.log('FCM token:', currentToken);

      // Send token to backend
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Sending FCM token to backend');
        try {
          const res = await _axios.post(
            '/user/updateFcm',
            { fcmToken: currentToken },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log('FCM token updated successfully:', res.data);
          return res;
        } catch (error) {
          console.error('Error updating FCM token:', error);
          return currentToken; // Return token even if backend fails
        }
      } else {
        console.warn('No auth token available to update FCM token');
        return currentToken;
      }
    } else {
      console.warn('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error in requestForToken:', error);
    if (error.code === 'messaging/unsupported-browser') {
      console.error('Safari may require additional configuration for FCM');
    }
    return null;
  }
};

// Only handle foreground messages
export const onMessageListener = () => {
  console.log('message listening....')
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);

    // Generate a unique ID for this notification
    const messageId = payload.data?.id || `${payload.messageId}-${Date.now()}`;

    // Check if we've already processed this notification
    if (processedNotifications.has(messageId)) {
      console.log('Duplicate notification ignored:', messageId);
      return;
    }

    // Mark this notification as processed
    processedNotifications.add(messageId);

    // Only show notification if app is in foreground
    if (document.visibilityState === 'visible') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Notification', {
          body: payload.notification?.body,
          icon: '/favicon.png',
          data: payload.data || {},
          tag: messageId,
        });
      }
    }
  });
};

// Safari-specific service worker registration check
if (typeof window !== 'undefined' && (window as any).safari) {
  window.addEventListener('load', () => {
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Active SW registrations:', registrations);
    if (registrations.length === 0) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.error('SW registration failed:', err));
    }
  });
}
  });
}

export { db, messaging };