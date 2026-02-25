import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import { getTopicMeta, timeAgo, estimateReadTime } from "@/lib/utils";

export default function ArticleCard({ article }) {
  const primaryTopic = article.topicTags?.[0];
  const topicMeta = getTopicMeta(primaryTopic);

  return (
    <Link href={`/article/${article.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Image / gradient fallback */}
        <div className="aspect-video relative flex-shrink-0">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${topicMeta.gradient} flex items-center justify-center`}
            >
              <span className="text-4xl">{topicMeta.emoji}</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          {/* Source + time */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-gray-500 font-medium">{article.source}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{timeAgo(article.publishedAt)}</span>
          </div>

          {/* Title */}
          <h2 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors leading-snug">
            {article.title}
          </h2>

          {/* Summary snippet */}
          {article.summary && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{article.summary}</p>
          )}

          {/* Why it matters */}
          {article.whyItMatters && (
            <div className="border-l-4 border-amber-400 bg-amber-50 px-3 py-2 mb-3 rounded-r-lg">
              <p className="text-xs text-amber-900 line-clamp-1 font-medium">
                {article.whyItMatters}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-2">
            {primaryTopic ? (
              <Badge topic={primaryTopic} label={topicMeta.label} />
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">
              {estimateReadTime(article.simplifiedBody)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
