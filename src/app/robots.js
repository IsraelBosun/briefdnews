export default function robots() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/profile", "/onboarding", "/login"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
