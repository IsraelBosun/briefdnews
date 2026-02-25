import { verifyToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(req) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb
    .collection("users")
    .doc(user.uid)
    .collection("preferences")
    .get();

  const preferences = [];
  snap.forEach((doc) => preferences.push({ id: doc.id, ...doc.data() }));

  return NextResponse.json({ preferences });
}

export async function POST(req) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topics } = await req.json();
  if (!Array.isArray(topics) || topics.length === 0) {
    return NextResponse.json({ error: "topics must be a non-empty array" }, { status: 400 });
  }

  const prefsRef = adminDb.collection("users").doc(user.uid).collection("preferences");
  const batch = adminDb.batch();

  for (const slug of topics) {
    const docRef = prefsRef.doc(slug);
    batch.set(docRef, { topicSlug: slug, weight: 1.0 }, { merge: true });
  }

  await batch.commit();

  return NextResponse.json({ ok: true });
}
