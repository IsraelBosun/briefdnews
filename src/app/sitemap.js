import { adminDb } from "@/lib/firebase-admin";

export const revalidate = 3600; // regenerate every hour

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";

  const staticRoutes = ["/", "/feed", "/digest"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: path === "/" ? 1 : 0.8,
  }));

  try {
    const snap = await adminDb
      .collection("articles")
      .where("processedAt", "!=", null)
      .orderBy("processedAt", "desc")
      .limit(1000)
      .get();

    const articleRoutes = [];
    snap.forEach((doc) => {
      articleRoutes.push({
        url: `${base}/article/${doc.id}`,
        lastModified: doc.data().processedAt?.toDate() || new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    });

    return [...staticRoutes, ...articleRoutes];
  } catch {
    return staticRoutes;
  }
}
