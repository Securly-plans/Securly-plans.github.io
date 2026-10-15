import { getMessaging, getToken, onMessage }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

import { app } from "./firebase.js";

const messaging = getMessaging(app);

/* ================= REQUEST PERMISSION ================= */

export async function initPushNotifications() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notifications denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: "BCDlkH0Kp2EWLGF3KA08a-FaGm9bMkPoIGWN9bPz5jdVOHAiyK5xg7Bfz1U236BHvG4l7QOKH2l_UI0DbwwTInI"
    });

    if (token) {
      console.log("FCM Token:", token);
      localStorage.setItem("fcmToken", token);
    }

    return token;

  } catch (err) {
    console.error("Push init error:", err);
  }
}

/* ================= FOREGROUND NOTIFICATIONS ================= */

onMessage(messaging, (payload) => {
  const title = payload?.notification?.title || "Notification";
  const body = payload?.notification?.body || "";

  alert(`${title}\n\n${body}`);
});
