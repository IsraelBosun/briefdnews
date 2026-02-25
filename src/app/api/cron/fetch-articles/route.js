import { runIngestionPipeline } from "@/lib/ingestion";
import { NextResponse } from "next/server";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire and forget — return 200 immediately so cron-job.org doesn't timeout
  runIngestionPipeline().catch((e) => console.error("[cron] Ingestion error:", e));
  return NextResponse.json({ ok: true });
}
