import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { serializeArticle } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userSnap = await adminDb.collection("users").doc(user.uid).get();
  const bookmarkIds = userSnap.data()?.bookmarks || [];

  if (bookmarkIds.length === 0) return NextResponse.json({ articles: [] });

  // Firestore "in" query supports up to 30 items per chunk
  const articles = [];
  for (let i = 0; i < bookmarkIds.length; i += 30) {
    const chunk = bookmarkIds.slice(i, i + 30);
    const snap = await adminDb
      .collection("articles")
      .where("__name__", "in", chunk)
      .get();
    snap.forEach((doc) => articles.push(serializeArticle(doc)));
  }

  return NextResponse.json({ articles });
}
