import { adminDb } from "./firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function getLatestFeed(userId, limit = 20) {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 48 * 60 * 60 * 1000));
  const articlesSnap = await adminDb
    .collection("articles")
    .where("processedAt", ">=", cutoff)
    .orderBy("processedAt", "desc")
    .limit(limit)
    .get();

  // Filter out already-read and unprocessed articles
  const historySnap = await adminDb
    .collection("readingHistory")
    .where("userId", "==", userId)
    .get();
  const readArticleIds = new Set();
  historySnap.forEach((doc) => readArticleIds.add(doc.data().articleId));

  const articles = [];
  articlesSnap.forEach((doc) => {
    const article = { id: doc.id, ...doc.data() };
    if (readArticleIds.has(article.id)) return;
    if (!article.simplifiedBody) return;
    articles.push(article);
  });

  return articles;
}

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

export async function updateTopicWeightsFromReading(userId, articleId, completed, reaction = null) {
  const articleSnap = await adminDb.collection("articles").doc(articleId).get();
  if (!articleSnap.exists) return;

  const { topicTags = [] } = articleSnap.data();

  // Reactions override the base increment:
  // "important" = strong positive signal, "boring" = negative signal
  let increment;
  if (reaction === "important") {
    increment = 0.3;
  } else if (reaction === "interesting") {
    increment = 0.15;
  } else if (reaction === "boring") {
    increment = -0.15;
  } else {
    increment = completed ? 0.1 : 0.02;
  }

  const batch = adminDb.batch();
  const prefsRef = adminDb.collection("users").doc(userId).collection("preferences");

  for (const topicSlug of topicTags) {
    const docRef = prefsRef.doc(topicSlug);
    const existing = await docRef.get();

    if (existing.exists) {
      const newWeight = Math.max(0.1, existing.data().weight + increment);
      batch.update(docRef, { weight: newWeight });
    } else if (increment > 0) {
      batch.set(docRef, { topicSlug, weight: 1.0 + increment });
    }
  }

  await batch.commit();
}
