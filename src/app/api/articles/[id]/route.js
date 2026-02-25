import { adminDb } from "@/lib/firebase-admin";
import { serializeArticle } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = await params;

  const docSnap = await adminDb.collection("articles").doc(id).get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({ article: serializeArticle(docSnap) });
}
