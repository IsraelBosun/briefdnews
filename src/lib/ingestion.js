import { RSS_SOURCES } from "../constants/sources.js";
import { fetchRSSFeed } from "./rss.js";
import { scrapeArticle } from "./scraper.js";
import { processArticle } from "./gemini.js";
import { adminDb } from "./firebase-admin.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function runIngestionPipeline() {
  console.log("🔄 Starting ingestion pipeline...");

  for (const source of RSS_SOURCES) {
    const rawArticles = await fetchRSSFeed(source.url, source.label);

    for (const raw of rawArticles) {
      // Check if article already exists using sourceUrl as the unique key
      const existing = await adminDb
        .collection("articles")
        .where("sourceUrl", "==", raw.sourceUrl)
        .limit(1)
        .get();

      if (!existing.empty) continue;

      // Create stub document immediately so we don't re-process on next run
      const docRef = await adminDb.collection("articles").add({
        sourceUrl: raw.sourceUrl,
        title: raw.title,
        source: raw.source,
        publishedAt: Timestamp.fromDate(raw.publishedAt),
        imageUrl: raw.imageUrl || null,
        rawContent: null,
        summary: null,
        simplifiedBody: null,
        deepDive: null,
        whyItMatters: null,
        rabbitHole: null,
        topicTags: [],
        entities: [],
        weightScore: 0.5,
        processedAt: null,
      });

      // Process asynchronously — fire and forget, don't block the loop
      processAndUpdateArticle(docRef.id, raw.sourceUrl, raw.title, raw.imageUrl || null, raw.snippet || "").catch(
        (e) => console.error(`Failed to process article ${docRef.id}:`, e)
      );
    }
  }

  console.log("✅ Ingestion pipeline complete");
}

async function processAndUpdateArticle(id, url, title, rssImageUrl, rssSnippet) {
  const { content: rawContent, imageUrl: scrapedImageUrl } = await scrapeArticle(url);

  // Fall back to RSS snippet if scraping failed or returned too little content
  const content = rawContent.length >= 100 ? rawContent : rssSnippet;
  if (!content || content.length < 100) return;

  // Prefer RSS image if available; fall back to og:image from scraper
  const imageUrl = rssImageUrl || scrapedImageUrl;

  try {
    const aiData = await processArticle(title, content);

    await adminDb.collection("articles").doc(id).update({
      rawContent: content,
      imageUrl,
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
  } catch (error) {
    console.error(`Gemini processing failed for article ${id} — skipping:`, error.message);
    // Leave article fields null and move on — never block the pipeline
  }
}
