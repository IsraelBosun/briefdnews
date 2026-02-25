import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "Lumi News App/1.0" },
});

export async function fetchRSSFeed(url, sourceName) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map((item) => ({
      title: item.title || "",
      sourceUrl: item.link || "",
      source: sourceName,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      imageUrl: extractImageFromItem(item),
      snippet: item.contentSnippet || item.content || "",
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS from ${sourceName}:`, error);
    return [];
  }
}

function extractImageFromItem(item) {
  return (
    item["media:content"]?.$.url ||
    item.enclosure?.url ||
    undefined
  );
}
