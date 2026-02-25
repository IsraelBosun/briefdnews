import { extract } from "@extractus/article-extractor";

export async function scrapeArticle(url) {
  try {
    const article = await extract(url);
    return {
      content: article?.content || article?.description || "",
      imageUrl: article?.image || null,
    };
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return { content: "", imageUrl: null };
  }
}
