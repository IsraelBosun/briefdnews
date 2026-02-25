import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

if (!getApps().length) {
  // Next.js dotenv and node --env-file handle private key escaping differently.
  // This handles both: literal \n sequences AND already-escaped newlines,
  // plus strips any surrounding quotes some loaders may leave in.
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
  const privateKey = rawKey
    .replace(/^["']|["']$/g, "")   // strip surrounding quotes if present
    .replace(/\\n/g, "\n");        // convert literal \n to real newlines

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export const adminDb = getFirestore();
export const adminMessaging = getMessaging();
