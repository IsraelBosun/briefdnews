import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { serializeArticle } from "@/lib/utils";
import { Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function GET(req) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get user's topic preferences
    const prefsSnap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("preferences")
      .get();

    const userTopics = new Set();
    prefsSnap.forEach((doc) => userTopics.add(doc.id));

    // Last 7 days of processed articles
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const articlesSnap = await adminDb
      .collection("articles")
      .where("processedAt", ">=", cutoff)
      .orderBy("processedAt", "desc")
      .limit(300)
      .get();

    // Group by topic — top 3 per topic by weightScore, filtered to user's topics
    const byTopic = {};
    articlesSnap.forEach((doc) => {
      const article = serializeArticle(doc);
      if (!article.simplifiedBody) return;

      for (const tag of article.topicTags || []) {
        // Only include topics the user cares about (or all if no prefs set)
        if (userTopics.size > 0 && !userTopics.has(tag)) continue;
        if (!byTopic[tag]) byTopic[tag] = [];
        byTopic[tag].push(article);
      }
    });

    // Sort each topic's articles by weightScore, keep top 3
    for (const tag of Object.keys(byTopic)) {
      byTopic[tag] = byTopic[tag]
        .sort((a, b) => (b.weightScore || 0) - (a.weightScore || 0))
        .slice(0, 3);
    }

    // Week reading stats
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const historySnap = await adminDb
      .collection("readingHistory")
      .where("userId", "==", user.uid)
      .get();

    let articlesRead = 0;
    historySnap.forEach((doc) => {
      const readAt = doc.data().readAt?.toDate?.();
      if (readAt && readAt >= weekStart) articlesRead++;
    });

    const userSnap = await adminDb.collection("users").doc(user.uid).get();
    const streak = userSnap.data()?.readingStreak || 0;

    return NextResponse.json({ byTopic, stats: { articlesRead, streak } });
  } catch (err) {
    console.error("[/api/digest] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
