import { verifyToken } from "@/lib/auth";
import { rewriteInTone } from "@/lib/gemini";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(req) {
  const user = await verifyToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 5 rewrites per user per minute
  const { success } = rateLimit({ key: `rewrite_${user.uid}`, limit: 5, windowMs: 60000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { tone, content } = await req.json();
  if (!tone || !content) {
    return NextResponse.json({ error: "Missing tone or content" }, { status: 400 });
  }

  try {
    const rewritten = await rewriteInTone(content, tone);
    return NextResponse.json({ content: rewritten });
  } catch (err) {
    console.error("[/api/articles/rewrite] Error:", err);
    return NextResponse.json({ error: "Rewrite failed" }, { status: 500 });
  }
}
