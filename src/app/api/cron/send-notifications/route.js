import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import { getPersonalizedFeed } from "@/lib/personalization";
import { NextResponse } from "next/server";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all users with notifications enabled and a valid token
    const usersSnap = await adminDb
      .collection("users")
      .where("notificationsOn", "==", true)
      .get();

    const eligible = [];
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.fcmToken) eligible.push({ id: doc.id, ...data });
    });

    if (eligible.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const user of eligible) {
      try {
        // Get their top unread personalised article
        const feed = await getPersonalizedFeed(user.id, 1);
        if (feed.length === 0) continue;

        const article = feed[0];

        await adminMessaging.send({
          token: user.fcmToken,
          notification: {
            title: "Your morning briefing ☀️",
            body: article.title,
          },
          webpush: {
            notification: { icon: "/icon-192x192.png" },
            fcmOptions: { link: `/article/${article.id}` },
          },
        });

        sent++;
      } catch (err) {
        // Invalid/expired token — clear it so we don't retry
        if (
          err.code === "messaging/invalid-registration-token" ||
          err.code === "messaging/registration-token-not-registered"
        ) {
          await adminDb.collection("users").doc(user.id).update({
            fcmToken: null,
            notificationsOn: false,
          });
        }
        console.error(`Failed to notify user ${user.id}:`, err.message);
        failed++;
      }
    }

    console.log(`[send-notifications] sent=${sent} failed=${failed}`);
    return NextResponse.json({ ok: true, sent, failed });
  } catch (err) {
    console.error("[send-notifications] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
