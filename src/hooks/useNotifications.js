"use client";

import { doc, updateDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { db, getMessagingInstance } from "@/lib/firebase";

export function useNotifications(user) {
  async function requestPermission() {
    if (!user || typeof window === "undefined") return false;

    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return false;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) return false;

      await updateDoc(doc(db, "users", user.uid), {
        fcmToken: token,
        notificationsOn: true,
      });

      return true;
    } catch (err) {
      console.error("[notifications] Failed to enable:", err);
      return false;
    }
  }

  async function disableNotifications() {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), {
      fcmToken: null,
      notificationsOn: false,
    });
  }

  return { requestPermission, disableNotifications };
}
