import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

let cred = JSON.parse(readFileSync('credentials.json', 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(cred),
  });
}

const sentNotifications = new Set();

export async function sendNotification(
  token: string,
  title: string,
  body: string,
  payload: any = {}
): Promise<boolean> {
  try {
    if (!token) throw new Error('Token not found');
    if (!title) throw new Error('Title not found');
    if (!body) throw new Error('Body not found');

    const notificationId = `${token}-${title}-${body}-${Date.now()}`;
    if (sentNotifications.has(notificationId)) {
      console.log('Duplicate notification ignored:', notificationId);
      return false;
    }
    sentNotifications.add(notificationId);

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        id: notificationId,
        title,
        body,
        ...payload,
      },
      apns: {
        headers: {
          'apns-push-type': 'alert',
          'apns-priority': '10',

        },
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            badge: 1,
            sound: 'default',
            'thread-id': 'ecommerce-notification',
            'mutable-content': 1,
          },
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title,
          body,
          icon: 'https://ecommerce-76923.firebaseapp.com/favicon.png',
          badge: 'https://ecommerce-76923.firebaseapp.com/favicon.png',
          requireInteraction: true,
        },
        fcm_options: {
          link: 'https://ecommerce-76923.firebaseapp.com',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`Notification sent to ${token}:`, response);
    return true;
  } catch (error: any) {
    console.error(`Error sending notification to ${token}:`, error);
    if (error.code === 'messaging/registration-token-not-registered') {
      return false;
    }
    throw error;
  }
}

export const db = admin.firestore();

// import admin from "firebase-admin";
// import { readFileSync } from "node:fs";

// let cred = JSON.parse(readFileSync('credentials.json', 'utf-8'));

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(cred),
//   });
// }

// export async function sendNotification(
//   token: string,
//   title: string,
//   body: string,
//   payload: any = {},
// ) {
//   try {
//     if (!token) throw new Error("Token not found");
//     if (!title) throw new Error("Title not found");
//     if (!body) throw new Error("Body not found");

//     await admin.messaging().send({
//       token,
//       data: {
//         title,
//         body,
//         ...payload,
//       },
//       notification: {
//         title,
//         body,
//       },
//     });

//     return true;
//   } catch (error) {
//     console.log(error);

//     return false;
//   }
// }

// export const db = admin.firestore();