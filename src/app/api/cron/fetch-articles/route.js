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
