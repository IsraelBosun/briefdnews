"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { getTopicMeta, timeAgo } from "@/lib/utils";

export default function RelatedArticles({ articleId }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/articles/${articleId}/related`, { headers });
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (err) {
        // Best-effort — silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [articleId]);

  if (loading) {
    return (
      <div className="mt-10 pt-6 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Related Stories</p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-3/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className="mt-10 pt-6 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Related Stories</p>
      <div className="space-y-3">
        {articles.map((article) => {
          const topicMeta = getTopicMeta(article.topicTags?.[0]);
          return (
            <Link key={article.id} href={`/article/${article.id}`} className="flex gap-3 group">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden relative">
                {article.imageUrl ? (
                  <Image src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${topicMeta.gradient} flex items-center justify-center`}>
                    <span className="text-xl">{topicMeta.emoji}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                  {article.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {article.source} · {timeAgo(article.publishedAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
