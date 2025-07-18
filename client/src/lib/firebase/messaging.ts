let messaging: import('firebase/messaging').Messaging | null = null;

export const requestPermissionAndToken = async () => {
    if (typeof window === 'undefined') return;

    const { getMessaging, getToken } = await import('firebase/messaging');
    const { firebaseApp } = await import('./firebase');

    if (!firebaseApp) return;

    messaging = getMessaging(firebaseApp);

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            });
            console.log('FCM Token:', token);
            return token;
        }
    } catch (err) {
        console.error('Error getting FCM token:', err);
    }
};
