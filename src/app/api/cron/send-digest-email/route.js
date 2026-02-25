import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";
import { getPersonalizedFeed } from "@/lib/personalization";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildEmailHtml(userName, articles, baseUrl) {
  const articleRows = articles
    .map(
      (a) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6;">
          <a href="${baseUrl}/article/${a.id}"
             style="font-size: 15px; font-weight: 600; color: #111827; text-decoration: none; line-height: 1.4;">
            ${a.title}
          </a>
          <p style="margin: 6px 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
            ${a.summary || ""}
          </p>
          <p style="margin: 6px 0 0; font-size: 12px; color: #9ca3af;">
            ${a.source}
          </p>
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#f59e0b;padding:28px 32px;">
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">
              Lumi <span style="opacity:0.8;">✦</span>
            </h1>
            <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">
              Your weekly news digest
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 24px;font-size:15px;color:#374151;">
              Hi ${userName || "there"}, here are your top stories from this week.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${articleRows}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 32px;">
            <a href="${baseUrl}/feed"
               style="display:inline-block;background:#f59e0b;color:#ffffff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:100px;text-decoration:none;">
              Read more on Lumi →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You're receiving this because you signed up for Lumi.
              <a href="${baseUrl}/profile" style="color:#f59e0b;text-decoration:none;">Manage preferences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Lumi <onboarding@resend.dev>";

  try {
    const usersSnap = await adminDb.collection("users").get();

    let sent = 0;
    let failed = 0;

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      if (!user.email) continue;

      try {
        const articles = await getPersonalizedFeed(userDoc.id, 5);
        if (articles.length === 0) continue;

        const html = buildEmailHtml(user.name, articles, baseUrl);

        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: `Your Lumi digest — ${new Date().toLocaleDateString("en", { month: "long", day: "numeric" })}`,
          html,
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send digest to ${userDoc.id}:`, err.message);
        failed++;
      }
    }

    console.log(`[send-digest-email] sent=${sent} failed=${failed}`);
    return NextResponse.json({ ok: true, sent, failed });
  } catch (err) {
    console.error("[send-digest-email] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
