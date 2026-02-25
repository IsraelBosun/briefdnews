import { verifyToken } from "@/lib/auth";
import { updateTopicWeightsFromReading } from "@/lib/personalization";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { articleId, completed, reaction } = await req.json();

  // Composite ID ensures one record per user per article
  const docId = `${user.uid}_${articleId}`;

  await adminDb.collection("readingHistory").doc(docId).set(
    {
      userId: user.uid,
      articleId,
      completed: completed || false,
      reaction: reaction !== undefined ? reaction : null,
      readAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (completed) {
    await updateTopicWeightsFromReading(user.uid, articleId, true);
  }

  // Update reading streak — once per day
  try {
    const userRef = adminDb.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const { readingStreak = 0, lastReadDate = null } = userSnap.data();
      const today = new Date().toISOString().split("T")[0];

      if (lastReadDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const newStreak = lastReadDate === yesterday ? readingStreak + 1 : 1;
        await userRef.update({ readingStreak: newStreak, lastReadDate: today });
      }
    }
  } catch (err) {
    // Streak update is best-effort — never fail the request over it
    console.error("Streak update failed:", err.message);
  }

  return NextResponse.json({ ok: true });
}
