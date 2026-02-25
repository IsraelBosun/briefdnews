import ArticleCard from "./ArticleCard";
import ArticleCardSkeleton from "./ArticleCardSkeleton";

export default function FeedSection({ articles, isLoading, error }) {
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">Could not load articles.</p>
        <p className="text-gray-300 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">📰</p>
        <p className="text-gray-500 text-lg font-medium">No articles yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Run the ingestion pipeline to fetch the latest news.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
