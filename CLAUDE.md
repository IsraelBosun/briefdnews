# CLAUDE.md — Lumi News App

## Project Overview

**Lumi** is an AI-powered news aggregation and personalization web app that makes news engaging for people who typically avoid reading the news. It fetches articles from Google News RSS feeds and Nigerian news sources, processes them with the Gemini API (summarization, simplification, tagging), and delivers a personalized, beautifully designed reading experience.

**Tagline:** *News that actually makes sense to you.*

**Target Users:** People who want to stay informed but find traditional news sites overwhelming, dry, or time-consuming.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | JavaScript (ES6+) |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Authentication | Firebase Auth (Google Sign-In) |
| AI | Google Gemini API (`gemini-1.5-flash` for speed and cost) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Background Jobs | Node-cron (runs inside Next.js) |
| Email | Resend |
| Deployment | Vercel |
| Analytics | PostHog |

> **Why Firebase for everything?** One Firebase project gives you Firestore (database), Auth (Google login), and FCM (push notifications) — all under one dashboard, one SDK, and one set of credentials. No separate OAuth setup, no separate database hosting.

---

## Firebase Project Structure (Firestore Collections)

Firestore is a NoSQL document database. Instead of tables and rows, you have **collections** and **documents**. Here is how Lumi's data is organized:

```
firestore/
├── users/
│   └── {userId}/                        # Document per user (uid from Firebase Auth)
│       ├── email: string
│       ├── name: string
│       ├── photoURL: string
│       ├── onboardingDone: boolean
│       ├── notificationsOn: boolean
│       ├── tonePreference: "FORMAL" | "CONVERSATIONAL" | "LIKE_A_FRIEND"
│       ├── fcmToken: string
│       ├── readingStreak: number
│       ├── createdAt: timestamp
│       └── preferences/                 # Subcollection
│           └── {topicSlug}/             # One doc per topic the user selected
│               ├── topicSlug: string
│               └── weight: number       # Starts at 1.0, grows as user reads
│
├── articles/
│   └── {articleId}/                     # Auto-generated Firestore ID
│       ├── sourceUrl: string            # Unique — always check before creating
│       ├── title: string
│       ├── source: string               # e.g. "BBC News", "Punch"
│       ├── publishedAt: timestamp
│       ├── imageUrl: string | null
│       ├── rawContent: string | null
│       ├── summary: string | null       # 2-line AI summary
│       ├── simplifiedBody: string | null  # 60-second read version
│       ├── deepDive: string | null      # AI background/context
│       ├── whyItMatters: string | null  # "This matters because..."
│       ├── rabbitHole: string | null    # AI question + explainer
│       ├── topicTags: array of strings  # e.g. ["nigeria", "business"]
│       ├── entities: array of strings   # People, orgs, places mentioned
│       ├── weightScore: number          # 0.0 - 1.0
│       └── processedAt: timestamp | null
│
└── readingHistory/
    └── {userId}_{articleId}/            # Composite ID to enforce uniqueness
        ├── userId: string
        ├── articleId: string
        ├── readAt: timestamp
        ├── completed: boolean
        └── reaction: string | null      # "interesting" | "boring" | "important"
```

---

## Project Structure

```
lumi/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.jsx
│   │   └── onboarding/page.jsx
│   ├── (main)/
│   │   ├── feed/page.jsx         # Home feed
│   │   ├── article/[id]/page.jsx # Article reader
│   │   ├── digest/page.jsx       # Weekly digest
│   │   └── profile/page.jsx      # User preferences
│   ├── api/
│   │   ├── feed/route.js
│   │   ├── articles/[id]/route.js
│   │   ├── preferences/route.js
│   │   ├── reading-history/route.js
│   │   ├── digest/route.js
│   │   └── cron/
│   │       ├── fetch-articles/route.js   # Called every 30 mins
│   │       └── send-notifications/route.js
│   ├── layout.jsx
│   └── page.jsx                  # Landing page
├── components/
│   ├── feed/
│   │   ├── ArticleCard.jsx
│   │   ├── FeedSection.jsx
│   │   ├── QuickTake.jsx
│   │   └── TopicFilter.jsx
│   ├── article/
│   │   ├── ArticleReader.jsx
│   │   ├── LayerToggle.jsx       # Summary / Full / Deep Dive
│   │   ├── RabbitHole.jsx
│   │   └── ToneSelector.jsx
│   ├── onboarding/
│   │   ├── SwipeCard.jsx
│   │   └── TopicDeck.jsx
│   ├── digest/
│   │   └── WeeklyDigest.jsx
│   └── ui/                       # Reusable UI primitives
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Badge.jsx
│       └── Skeleton.jsx
├── lib/
│   ├── firebase.js               # Firebase client SDK (browser-safe)
│   ├── firebase-admin.js         # Firebase Admin SDK (server/API routes only)
│   ├── auth.js                   # verifyToken() helper for API route protection
│   ├── gemini.js                 # Gemini API client + prompts
│   ├── rss.js                    # RSS fetching + parsing
│   ├── scraper.js                # Full-text article scraping
│   ├── personalization.js        # Feed ranking logic
│   └── ingestion.js              # Full pipeline orchestrator
├── hooks/
│   ├── useAuth.js                # Firebase Auth state listener
│   ├── useReadingHistory.js
│   ├── useFeed.js
│   └── usePreferences.js
└── constants/
    ├── topics.js                 # Topic definitions
    └── sources.js                # RSS feed URLs
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Client SDK (NEXT_PUBLIC_ prefix = safe to use in browser)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="your-vapid-key"   # For push notifications

# Firebase Admin SDK (server-only — NEVER expose these to the browser)
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Resend (email)
RESEND_API_KEY="your-resend-api-key"

# PostHog (analytics)
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Cron secret (to protect cron endpoints from unauthorized calls)
CRON_SECRET="your-cron-secret"
```

> **Where to get Firebase credentials:** Go to [console.firebase.google.com](https://console.firebase.google.com), create a project, go to **Project Settings → General** for the client config values (`NEXT_PUBLIC_` ones), and **Project Settings → Service Accounts → Generate New Private Key** for the Admin SDK credentials.

---

## Core Library Files

### `lib/firebase.js` — Client SDK (Browser)
```javascript
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initializing on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};
```

### `lib/firebase-admin.js` — Admin SDK (Server Only)
```javascript
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Replace escaped newlines in the private key string
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb = getFirestore();
export const adminMessaging = getMessaging();
```

### `lib/auth.js` — Verify Firebase ID Tokens in API Routes
```javascript
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function verifyToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded; // contains uid, email, name, picture
  } catch (error) {
    return null;
  }
}
```

### `lib/gemini.js` — AI Processing
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function processArticle(title, content) {
  const prompt = `
You are a news editor for Lumi, an app that makes news easy and engaging.
Given the article below, return a JSON object with these exact fields:

{
  "summary": "2 sentences max. Plain language. What happened and why it matters.",
  "simplifiedBody": "A 60-second read version. 150-200 words. Conversational tone. No jargon. Use short paragraphs.",
  "deepDive": "100-150 words of background context. Why does this situation exist? What history led to this?",
  "whyItMatters": "One sentence. Complete this: 'This matters because...'",
  "rabbitHole": "Ask one thought-provoking follow-up question, then answer it in 80 words.",
  "topicTags": ["array", "of", "relevant", "topic", "slugs", "from: nigeria, business, technology, world, politics, sports, entertainment, health, science, finance"],
  "entities": ["array", "of", "people", "organisations", "and", "places", "mentioned"],
  "weightScore": 0.0
}

weightScore rules: 0.9-1.0 = breaking/major national or global story. 0.6-0.8 = significant story. 0.3-0.5 = general interest. 0.1-0.2 = minor/niche.

Article Title: ${title}
Article Content: ${content.slice(0, 3000)}

Return ONLY the JSON object. No markdown, no explanation.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

export async function rewriteInTone(content, tone) {
  const toneInstructions = {
    FORMAL: "Rewrite this in a formal, professional journalistic tone.",
    CONVERSATIONAL: "Rewrite this in a clear, conversational tone suitable for a general audience.",
    LIKE_A_FRIEND: "Rewrite this as if you're a knowledgeable friend texting another friend about what happened. Casual, warm, no jargon. Use contractions.",
  };

  const prompt = `${toneInstructions[tone]}
Keep all facts intact. Do not add or remove information.
Article: ${content}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateWhyItMattersForUser(articleSummary, userTopics) {
  const prompt = `
Given this news summary and the user's interest topics, write ONE sentence explaining
why this story is personally relevant to someone interested in: ${userTopics.join(", ")}.
Start with "For you, this matters because..."

Summary: ${articleSummary}
Return only the sentence.
`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### `lib/rss.js` — RSS Fetching
```javascript
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "Lumi News App/1.0" },
});

export async function fetchRSSFeed(url, sourceName) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map((item) => ({
      title: item.title || "",
      sourceUrl: item.link || "",
      source: sourceName,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      imageUrl: extractImageFromItem(item),
      snippet: item.contentSnippet || item.content || "",
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS from ${sourceName}:`, error);
    return [];
  }
}

function extractImageFromItem(item) {
  return (
    item["media:content"]?.$.url ||
    item.enclosure?.url ||
    undefined
  );
}
```

### `lib/scraper.js` — Full Text Extraction
```javascript
import { extract } from "@extractus/article-extractor";

export async function scrapeArticleContent(url) {
  try {
    const article = await extract(url);
    return article?.content || article?.description || "";
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return "";
  }
}
```

### `lib/ingestion.js` — Full Pipeline
```javascript
import { RSS_SOURCES } from "@/constants/sources";
import { fetchRSSFeed } from "./rss";
import { scrapeArticleContent } from "./scraper";
import { processArticle } from "./gemini";
import { adminDb } from "./firebase-admin";
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
      processAndUpdateArticle(docRef.id, raw.sourceUrl, raw.title).catch(
        (e) => console.error(`Failed to process article ${docRef.id}:`, e)
      );
    }
  }

  console.log("✅ Ingestion pipeline complete");
}

async function processAndUpdateArticle(id, url, title) {
  const rawContent = await scrapeArticleContent(url);
  if (!rawContent || rawContent.length < 100) return;

  const aiData = await processArticle(title, rawContent);

  await adminDb.collection("articles").doc(id).update({
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
}
```

### `lib/personalization.js` — Feed Ranking
```javascript
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
```

---

## Authentication Flow (Firebase Auth)

Authentication is handled entirely by Firebase Auth — no NextAuth needed. Here is the flow:

**Login:** User clicks "Sign in with Google" → Firebase Auth opens Google popup → on success, Firebase returns a `user` object. On first login, create the user's document in `users/{uid}` in Firestore.

**API protection:** On every authenticated API call, the client sends the Firebase ID token in the `Authorization: Bearer {token}` header. The server calls `verifyToken()` from `lib/auth.js` to validate it server-side using the Admin SDK.

**Frontend auth state:** Use the `useAuth` hook which wraps Firebase's `onAuthStateChanged` listener.

### `hooks/useAuth.js`
```javascript
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  return { user, loading: user === undefined };
}
```

### Making authenticated API calls from the frontend
```javascript
import { auth } from "@/lib/firebase";

async function fetchFeed() {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch("/api/feed", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
```

---

## API Routes

### `app/api/feed/route.js`
```javascript
import { verifyToken } from "@/lib/auth";
import { getPersonalizedFeed } from "@/lib/personalization";
import { NextResponse } from "next/server";

export async function GET(req) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feed = await getPersonalizedFeed(user.uid);
  return NextResponse.json({ articles: feed });
}
```

### `app/api/reading-history/route.js`
```javascript
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

  await adminDb.collection("readingHistory").doc(docId).set({
    userId: user.uid,
    articleId,
    completed: completed || false,
    reaction: reaction || null,
    readAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  if (completed) {
    await updateTopicWeightsFromReading(user.uid, articleId, true);
  }

  return NextResponse.json({ ok: true });
}
```

### `app/api/cron/fetch-articles/route.js`
```javascript
import { runIngestionPipeline } from "@/lib/ingestion";
import { NextResponse } from "next/server";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await runIngestionPipeline();
  return NextResponse.json({ ok: true });
}
```

---

## Key Components

### Article Card Structure
Each `ArticleCard` component should display:
- Hero image (with fallback gradient based on topic color)
- Source name + time ago (e.g. "Punch · 2h ago")
- Headline (max 2 lines, truncated)
- AI 2-line summary
- "Why this matters" badge (one line, highlighted)
- Topic tag pill
- Read time estimate
- Bookmark button

### Article Reader — Layer Toggle
The reader has three modes toggled by a pill selector at the top:
- **Summary** — shows `article.summary` (2 lines)
- **Full Story** — shows `article.simplifiedBody` (60-second clean read)
- **Deep Dive** — shows `article.deepDive` (background context)

Below the content, always show:
- **Rabbit Hole** section (collapsible card with the AI question + answer)
- **Related Stories** (3 articles with matching topic tags, queried from Firestore)
- **Original Source** link

---

## Constants

### `constants/topics.js`
```javascript
export const TOPICS = [
  { slug: "nigeria",       label: "Nigeria",            emoji: "🇳🇬" },
  { slug: "business",      label: "Business & Economy", emoji: "💼" },
  { slug: "technology",    label: "Tech & AI",          emoji: "🤖" },
  { slug: "world",         label: "World News",         emoji: "🌍" },
  { slug: "politics",      label: "Politics",           emoji: "🏛️" },
  { slug: "sports",        label: "Sports",             emoji: "⚽" },
  { slug: "entertainment", label: "Entertainment",      emoji: "🎬" },
  { slug: "health",        label: "Health",             emoji: "🏥" },
  { slug: "science",       label: "Science",            emoji: "🔬" },
  { slug: "finance",       label: "Personal Finance",   emoji: "💰" },
];
```

### `constants/sources.js`
```javascript
export const RSS_SOURCES = [
  // Google News topic feeds
  { url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pPU2lnQVAB?hl=en-NG&gl=NG&ceid=NG:en", label: "Google News Nigeria" },
  { url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pPU2lnQVAB?hl=en-NG&gl=NG&ceid=NG:en", label: "Google News Business" },
  { url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pPU2lnQVAB?hl=en&gl=US&ceid=US:en", label: "Google News Technology" },
  // Nigerian sources
  { url: "https://punchng.com/feed/", label: "Punch Nigeria" },
  { url: "https://www.vanguardngr.com/feed/", label: "Vanguard Nigeria" },
  { url: "https://www.channelstv.com/feed/", label: "Channels TV" },
  { url: "https://techcabal.com/feed/", label: "TechCabal" },
  // International
  { url: "http://feeds.bbci.co.uk/news/world/africa/rss.xml", label: "BBC Africa" },
  { url: "https://www.theguardian.com/world/rss", label: "The Guardian World" },
];
```

---

## Milestones

### Milestone 1 — Content Engine
Build and verify the full article ingestion pipeline works end-to-end.

**Tasks:**
- Set up Next.js project with Tailwind CSS
- Set up Firebase project, enable Firestore, get all credentials
- Implement `lib/firebase-admin.js` — Admin SDK for server-side Firestore access
- Implement `lib/rss.js` — fetch and parse RSS feeds
- Implement `lib/scraper.js` — extract full article text
- Implement `lib/gemini.js` — process article through Gemini API
- Implement `lib/ingestion.js` — orchestrate the full pipeline
- Build `/api/cron/fetch-articles` endpoint
- Write a test script that runs the pipeline manually and logs output to console
- Verify 20+ articles appear in Firestore's `articles` collection with `summary`, `simplifiedBody`, `topicTags`, and `weightScore` filled in

**Done when:** Running the ingestion endpoint populates Firestore with fully AI-processed articles visible in the Firebase console.

---

### Milestone 2 — Read-Only Frontend
A publicly accessible feed and article reader. No auth yet.

**Tasks:**
- Implement `lib/firebase.js` — client SDK setup
- Build landing page (`app/page.jsx`) — hero section, feature highlights, CTA
- Build feed page (`app/(main)/feed/page.jsx`) — grid of ArticleCards fetched from `/api/feed`
- Build article reader page (`app/(main)/article/[id]/page.jsx`) — full reader with layer toggle
- Build `ArticleCard`, `FeedSection`, `LayerToggle`, `RabbitHole` components
- Add topic filter bar at top of feed
- Ensure fully responsive (mobile-first)
- Add skeleton loaders for feed and article

**Done when:** A visitor can browse the feed, click an article, toggle between Summary / Full Story / Deep Dive, and see the rabbit hole section.

---

### Milestone 3 — Auth & Personalization
User accounts, onboarding, and a personalized feed.

**Tasks:**
- Enable Google Sign-In in Firebase Console (Authentication → Sign-in method → Google)
- Implement `hooks/useAuth.js` — Firebase auth state listener
- Implement `lib/auth.js` — `verifyToken()` for protecting API routes
- Build login page with "Sign in with Google" button using Firebase Auth
- On first login, create user document in Firestore `users/{uid}`
- Build swipe-based onboarding (`app/(auth)/onboarding/page.jsx`) using `SwipeCard` component
- Save onboarding topic selections as docs in `users/{uid}/preferences/` subcollection
- Wire up `getPersonalizedFeed()` to authenticated feed page
- Build `/api/reading-history/route.js` — log article views and completions
- Call `updateTopicWeightsFromReading()` when user finishes an article
- Build profile/preferences page where user can adjust topic interests and tone preference

**Done when:** Different users see different feeds based on their onboarding selections, and the feed updates over time based on reading behavior.

---

### Milestone 4 — Engagement Features
Make Lumi sticky and delightful.

**Tasks:**
- Implement tone selector in article reader (calls `rewriteInTone()` on demand)
- Build weekly digest page (`app/(main)/digest/page.jsx`) — summary of week's reading
- Set up Firebase Cloud Messaging — request browser permission, save FCM token to `users/{uid}`, send morning push notification with top personalized story via `/api/cron/send-notifications`
- Add article reactions ("Interesting", "Important", "Boring") — stored in `readingHistory`, factor into personalization
- Add bookmarking — store bookmarked article IDs in `users/{uid}` document, show saved list in profile
- Implement "Why it matters for you" — personalized line using `generateWhyItMattersForUser()`
- Add reading streak counter tracked in `users/{uid}`

**Done when:** Users receive morning push notifications, can react to articles, bookmark stories, control their reading tone, and see their weekly digest.

---

### Milestone 5 — Polish & Launch
Production-ready, fast, discoverable.

**Tasks:**
- SEO: add metadata, Open Graph tags, sitemap
- Performance: implement ISR (Incremental Static Regeneration) for article pages
- Add PostHog analytics — track feed clicks, article completions, tone changes
- Set up Vercel cron jobs to call `/api/cron/fetch-articles` every 30 minutes
- Set up Firestore security rules — users can only read/write their own `users/{uid}` data; `articles` collection is publicly readable but only writable server-side via Admin SDK
- Set up Resend for weekly digest email (sent every Sunday 8am)
- Error handling: graceful fallbacks when Gemini API fails or article scraping fails
- Add rate limiting to API routes
- Security: sanitize all scraped HTML before rendering
- Final mobile responsiveness audit
- Write README with setup instructions

**Done when:** App is deployed to production on Vercel, cron jobs are running, Firestore security rules are live, and 5+ real users can sign up and use it without any manual intervention.

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Manually trigger article ingestion (for testing)
curl -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/fetch-articles
```

## Key Dependencies to Install

```bash
npm install firebase firebase-admin
npm install @google/generative-ai
npm install rss-parser
npm install @extractus/article-extractor
npm install resend
npm install posthog-js

npm install -D tailwindcss postcss autoprefixer
```

> No Prisma, no PostgreSQL, no NextAuth. Firebase handles the database, authentication, and push notifications all in one project.

---

## Important Rules for Claude Code

1. **Always use JavaScript (ES6+)** — use `.js` for all lib, API route, and utility files. Use `.jsx` for all React components and pages. No TypeScript.
2. **Use ES Modules** — always use `import`/`export` syntax. Never use `require()` or `module.exports`.
3. **Two Firebase SDKs, never mix them** — `lib/firebase.js` (client SDK) is for browser/React components only. `lib/firebase-admin.js` (Admin SDK) is for API routes and server-side code ONLY. Never import `firebase-admin` in a component or page.
4. **Never expose Admin credentials** — variables without `NEXT_PUBLIC_` prefix are server-only. Never reference `FIREBASE_ADMIN_PRIVATE_KEY` or `FIREBASE_ADMIN_CLIENT_EMAIL` in any client-side file.
5. **Firestore duplicate prevention** — always query by `sourceUrl` before creating a new article document. The `sourceUrl` field is the unique identifier for articles since Firestore doesn't have a built-in UNIQUE constraint.
6. **Gemini error handling** — always wrap Gemini calls in try/catch. If processing fails, leave the article fields null and move on. Never block the ingestion pipeline for one failed article.
7. **Mobile-first CSS** — all Tailwind styles start with mobile, use `md:` and `lg:` for larger screens.
8. **Skeleton loaders everywhere** — every data-fetching component needs a loading state with `Skeleton` components.
9. **Image safety** — always use `next/image` with a defined `width`/`height` or `fill`. Add a fallback for broken image URLs.
10. **Scraping is best-effort** — if `scrapeArticleContent()` returns less than 100 characters, skip Gemini processing for that article. Don't waste API calls on empty content.
11. **Keep Gemini costs low** — process each article only once. Store all AI outputs in Firestore. Never re-process an article that already has `processedAt` set.
12. **Firestore security rules (Milestone 5)** — ensure rules allow users to read/write only their own `users/{uid}` documents, and that the `articles` collection is publicly readable but only writable by the Admin SDK (server-side).