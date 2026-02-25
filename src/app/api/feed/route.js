import { verifyToken } from "@/lib/auth";
import { getPersonalizedFeed } from "@/lib/personalization";
import { serializeArticle } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");

    let articles = await getPersonalizedFeed(user.uid, 60);

    // Serialize Firestore Timestamps (getPersonalizedFeed returns raw admin docs)
    articles = articles.map((a) => serializeArticle(a));

    if (topic) {
      articles = articles.filter((a) => a.topicTags?.includes(topic));
    }

    articles = articles.slice(0, 20);

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[/api/feed] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
