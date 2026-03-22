import { verifyToken } from "@/lib/auth";
import { getPersonalizedFeed, getLatestFeed } from "@/lib/personalization";
import { serializeArticle } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");
    const mode = searchParams.get("mode") || "foryou"; // "foryou" | "latest"

    let articles;
    if (mode === "latest") {
      articles = await getLatestFeed(user.uid, 60);
    } else {
      articles = await getPersonalizedFeed(user.uid, 60);
    }

    // Serialize Firestore Timestamps
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
