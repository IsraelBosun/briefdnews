import { adminDb } from "@/lib/firebase-admin";
import { serializeArticle } from "@/lib/utils";
import { Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = await params;

  const docSnap = await adminDb.collection("articles").doc(id).get();
  if (!docSnap.exists) {
    return NextResponse.json({ articles: [] });
  }

  const { topicTags = [] } = docSnap.data();
  if (topicTags.length === 0) return NextResponse.json({ articles: [] });

  // Fetch articles sharing the primary topic tag, processed in last 72 hours
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 72 * 60 * 60 * 1000));
  const snap = await adminDb
    .collection("articles")
    .where("topicTags", "array-contains", topicTags[0])
    .where("processedAt", ">=", cutoff)
    .orderBy("processedAt", "desc")
    .limit(10)
    .get();

  const related = [];
  snap.forEach((doc) => {
    if (doc.id === id) return; // exclude current article
    const data = doc.data();
    if (!data.simplifiedBody) return;
    related.push(serializeArticle(doc));
  });

  return NextResponse.json({ articles: related.slice(0, 3) });
}
