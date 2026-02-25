import { notFound } from "next/navigation";

export const revalidate = 3600; // cache article pages for 1 hour
import { adminDb } from "@/lib/firebase-admin";
import { serializeArticle } from "@/lib/utils";
import ArticleReader from "@/components/article/ArticleReader";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const docSnap = await adminDb.collection("articles").doc(id).get();
  if (!docSnap.exists) return { title: "Article Not Found" };

  const article = serializeArticle(docSnap);
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.imageUrl ? [{ url: article.imageUrl }] : [],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { id } = await params;
  const docSnap = await adminDb.collection("articles").doc(id).get();

  if (!docSnap.exists) notFound();

  const article = serializeArticle(docSnap);

  return <ArticleReader article={article} />;
}
