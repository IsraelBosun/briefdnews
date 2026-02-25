/**
 * Milestone 1 test script — runs the ingestion pipeline for a single article
 * and logs the full AI-processed result to the console.
 *
 * Usage:
 *   node --env-file=.env scripts/test-ingestion.js
 *
 * What it does:
 *   1. Fetches RSS from BBC Africa (reliable, no paywalls)
 *   2. Picks the first article not already in Firestore
 *   3. Scrapes full content
 *   4. Sends to Gemini for AI processing
 *   5. Saves to Firestore articles collection
 *   6. Logs the complete result
 */

import { fetchRSSFeed } from "../src/lib/rss.js";
import { scrapeArticleContent } from "../src/lib/scraper.js";
import { processArticle } from "../src/lib/gemini.js";
import { adminDb } from "../src/lib/firebase-admin.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const TEST_SOURCE = {
  url: "http://feeds.bbci.co.uk/news/world/africa/rss.xml",
  label: "BBC Africa",
};

console.log("🧪 Lumi — Milestone 1 Ingestion Test");
console.log("=".repeat(50));

// Step 1: Fetch RSS
console.log(`\n📡 Fetching RSS from ${TEST_SOURCE.label}...`);
const articles = await fetchRSSFeed(TEST_SOURCE.url, TEST_SOURCE.label);

if (articles.length === 0) {
  console.error("❌ No articles returned from RSS feed. Check your network connection.");
  process.exit(1);
}
console.log(`✅ Fetched ${articles.length} articles from RSS`);

// Step 2: Find first article not already in Firestore
let target = null;
for (const article of articles) {
  const existing = await adminDb
    .collection("articles")
    .where("sourceUrl", "==", article.sourceUrl)
    .limit(1)
    .get();

  if (existing.empty) {
    target = article;
    break;
  }
}

if (!target) {
  console.log("ℹ️  All articles from this feed are already in Firestore.");
  console.log("   Using the most recent article for processing test (will not re-save).");
  target = articles[0];
} else {
  console.log(`\n📰 Selected article: "${target.title}"`);
  console.log(`   Source URL: ${target.sourceUrl}`);
}

// Step 3: Scrape full content
console.log("\n🔍 Scraping article content...");
const rawContent = await scrapeArticleContent(target.sourceUrl);

if (!rawContent || rawContent.length < 100) {
  console.error(`❌ Scraped content too short (${rawContent?.length ?? 0} chars). Skipping Gemini.`);
  console.log("   Try a different article — some sites block scrapers.");
  process.exit(1);
}
console.log(`✅ Scraped ${rawContent.length} characters of content`);

// Step 4: Process with Gemini
console.log("\n🤖 Sending to Gemini for AI processing...");
let aiData;
try {
  aiData = await processArticle(target.title, rawContent);
  console.log("✅ Gemini processing complete");
} catch (error) {
  console.error("❌ Gemini processing failed:", error.message);
  process.exit(1);
}

// Step 5: Save to Firestore (only if it's a new article)
const existing = await adminDb
  .collection("articles")
  .where("sourceUrl", "==", target.sourceUrl)
  .limit(1)
  .get();

let articleId;
if (existing.empty) {
  const docRef = await adminDb.collection("articles").add({
    sourceUrl: target.sourceUrl,
    title: target.title,
    source: target.source,
    publishedAt: Timestamp.fromDate(target.publishedAt),
    imageUrl: target.imageUrl || null,
    rawContent,
    summary: aiData.summary,
    simplifiedBody: aiData.simplifiedBody,
    deepDive: aiData.deepDive,
    whyItMatters: aiData.whyItMatters,
    rabbitHole: aiData.rabbitHole,
    topicTags: aiData.topicTags,
    entities: aiData.entities,
    weightScore: aiData.weightScore,
    processedAt: FieldValue.serverTimestamp(),
  });
  articleId = docRef.id;
  console.log(`✅ Saved to Firestore with ID: ${articleId}`);
} else {
  articleId = existing.docs[0].id;
  console.log(`ℹ️  Article already exists in Firestore (ID: ${articleId}) — skipping save`);
}

// Step 6: Log the full result
console.log("\n" + "=".repeat(50));
console.log("📋 PROCESSED ARTICLE RESULT");
console.log("=".repeat(50));
console.log(`\nTitle:        ${target.title}`);
console.log(`Source:       ${target.source}`);
console.log(`Firestore ID: ${articleId}`);
console.log(`Topic Tags:   ${aiData.topicTags?.join(", ")}`);
console.log(`Entities:     ${aiData.entities?.join(", ")}`);
console.log(`Weight Score: ${aiData.weightScore}`);
console.log(`\n--- Summary ---\n${aiData.summary}`);
console.log(`\n--- Simplified Body (60-sec read) ---\n${aiData.simplifiedBody}`);
console.log(`\n--- Deep Dive ---\n${aiData.deepDive}`);
console.log(`\n--- Why It Matters ---\n${aiData.whyItMatters}`);
console.log(`\n--- Rabbit Hole ---\n${aiData.rabbitHole}`);
console.log("\n" + "=".repeat(50));
console.log("✅ Milestone 1 test complete — check your Firebase console to verify.");
console.log(`   https://console.firebase.google.com → Firestore → articles → ${articleId}`);

process.exit(0);




// npm run test:ingestion
