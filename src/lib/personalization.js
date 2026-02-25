import { adminDb } from "./firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function getPersonalizedFeed(userId, limit = 20) {
  // Get user topic weights from preferences subcollection
  const prefsSnap = await adminDb
    .collection("users")
    .doc(userId)
    .collection("preferences")
    .get();

  const topicWeights = {};
  prefsSnap.forEach((doc) => {
    topicWeights[doc.id] = doc.data().weight;
  });

  // Get articles processed in the last 48 hours
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 48 * 60 * 60 * 1000));
  const articlesSnap = await adminDb
    .collection("articles")
    .where("processedAt", ">=", cutoff)
    .orderBy("processedAt", "desc")
    .limit(100)
    .get();

  // Get article IDs this user has already read
  const historySnap = await adminDb
    .collection("readingHistory")
    .where("userId", "==", userId)
    .get();

  const readArticleIds = new Set();
  historySnap.forEach((doc) => readArticleIds.add(doc.data().articleId));

  // Score and filter articles
  const scored = [];
  articlesSnap.forEach((doc) => {
    const article = { id: doc.id, ...doc.data() };
    if (readArticleIds.has(article.id)) return;
    if (!article.simplifiedBody) return;

    let score = article.weightScore || 0.5;

    // Boost score by topic match weight
    (article.topicTags || []).forEach((tag) => {
      if (topicWeights[tag]) score += topicWeights[tag] * 0.3;
    });

    // Recency boost — articles under 6 hours old get +0.2
    const publishedMs = article.publishedAt?.toMillis?.() || 0;
    const ageHours = (Date.now() - publishedMs) / 3600000;
    if (ageHours < 6) score += 0.2;

    scored.push({ ...article, score });
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function updateTopicWeightsFromReading(userId, articleId, completed) {
  const articleSnap = await adminDb.collection("articles").doc(articleId).get();
  if (!articleSnap.exists) return;

  const { topicTags = [] } = articleSnap.data();
  const increment = completed ? 0.1 : 0.02;

  const batch = adminDb.batch();
  const prefsRef = adminDb.collection("users").doc(userId).collection("preferences");

  for (const topicSlug of topicTags) {
    const docRef = prefsRef.doc(topicSlug);
    const existing = await docRef.get();

    if (existing.exists) {
      batch.update(docRef, { weight: existing.data().weight + increment });
    } else {
      batch.set(docRef, { topicSlug, weight: 1.0 + increment });
    }
  }

  await batch.commit();
}
