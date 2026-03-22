import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { serializeArticle } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) return NextResponse.json({ articles: [] });

  const terms = q.split(/\s+/).filter(Boolean);

  // Search by topicTags (array-contains for first term) and title text match
  // Firestore doesn't support full-text search natively, so we:
  // 1. Query by array-contains on topicTags for first term (handles topic searches)
  // 2. Query by entities array for first term
  // 3. Merge, deduplicate, then filter client-side on title

  const [tagSnap, entitySnap, titleSnap] = await Promise.all([
    adminDb
      .collection("articles")
      .where("topicTags", "array-contains", terms[0])
      .where("processedAt", "!=", null)
      .orderBy("processedAt", "desc")
      .limit(30)
      .get(),
    adminDb
      .collection("articles")
      .where("entities", "array-contains", terms[0])
      .where("processedAt", "!=", null)
      .orderBy("processedAt", "desc")
      .limit(30)
      .get(),
    // Title prefix search via Firestore range query
    adminDb
      .collection("articles")
      .orderBy("title")
      .startAt(q)
      .endAt(q + "\uf8ff")
      .limit(20)
      .get(),
  ]);

  const seen = new Set();
  const articles = [];

  for (const snap of [tagSnap, entitySnap, titleSnap]) {
    snap.forEach((doc) => {
      if (seen.has(doc.id)) return;
      const data = doc.data();
      if (!data.simplifiedBody) return;

      // Client-side filter: all terms must appear in title or summary
      const haystack = `${data.title} ${data.summary || ""} ${(data.entities || []).join(" ")} ${(data.topicTags || []).join(" ")}`.toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return;

      seen.add(doc.id);
      articles.push(serializeArticle(doc));
    });
  }

  return NextResponse.json({ articles: articles.slice(0, 10) });
}
