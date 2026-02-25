import Link from "next/link";
import { TOPICS } from "@/constants/topics";
import { getTopicMeta, timeAgo } from "@/lib/utils";

function weekRange() {
  const end = new Date();
  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toLocaleDateString("en", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function WeeklyDigest({ byTopic, stats }) {
  // Preserve user's topic order from TOPICS constant
  const orderedTopics = TOPICS.map((t) => t.slug).filter(
    (slug) => byTopic[slug]?.length > 0
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-1">{weekRange()}</p>
        <h1 className="text-2xl font-bold text-gray-900">Your week in news</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
          <p className="text-4xl font-bold text-amber-600">{stats.articlesRead}</p>
          <p className="text-sm text-amber-700 mt-1">articles read</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
          <p className="text-4xl font-bold text-amber-600">
            🔥 {stats.streak}
          </p>
          <p className="text-sm text-amber-700 mt-1">day streak</p>
        </div>
      </div>

      {/* Topic sections */}
      {orderedTopics.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-gray-500 text-sm">
            No articles from this week yet.
            <br />
            Check back after the next ingestion run.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {orderedTopics.map((slug) => {
            const articles = byTopic[slug];
            const meta = getTopicMeta(slug);
            return (
              <section key={slug}>
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-4">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${meta.bg}`}
                  >
                    {meta.emoji}
                  </span>
                  <span>{meta.label}</span>
                </h2>

                <div className="flex flex-col gap-3">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.id}`}
                      className="flex flex-col gap-1.5 p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-sm transition-all"
                    >
                      <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                        {article.title}
                      </p>
                      {article.summary && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {article.source} · {timeAgo(article.publishedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
