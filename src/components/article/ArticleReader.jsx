"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import LayerToggle from "./LayerToggle";
import ToneSelector from "./ToneSelector";
import RabbitHole from "./RabbitHole";
import Badge from "@/components/ui/Badge";
import { getTopicMeta, timeAgo, estimateReadTime } from "@/lib/utils";

const REACTIONS = [
  { value: "interesting", label: "Interesting", emoji: "🤔" },
  { value: "important",   label: "Important",   emoji: "⚡" },
  { value: "boring",      label: "Boring",       emoji: "😐" },
];

async function getToken() {
  return auth.currentUser?.getIdToken() ?? null;
}

export default function ArticleReader({ article }) {
  const [activeLayer, setActiveLayer] = useState("summary");
  const [imageError, setImageError] = useState(false);

  // Tone
  const [selectedTone, setSelectedTone] = useState("CONVERSATIONAL");
  const [toneCache, setToneCache] = useState({});
  const [toneLoading, setToneLoading] = useState(false);

  // Reactions
  const [reaction, setReaction] = useState(null);

  // Reading completion
  const completedRef = useRef(false);
  const contentRef = useRef(null);

  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks(user);

  const primaryTopic = article.topicTags?.[0];
  const topicMeta = getTopicMeta(primaryTopic);

  // Base content per layer
  const baseContent = {
    summary: article.summary,
    full: article.simplifiedBody,
    deep: article.deepDive,
  };

  // Apply cached tone rewrite if available, otherwise show base
  const cacheKey = `${activeLayer}_${selectedTone}`;
  const displayContent =
    selectedTone === "CONVERSATIONAL"
      ? baseContent[activeLayer]
      : toneCache[cacheKey] ?? baseContent[activeLayer];

  // Log initial view on mount
  useEffect(() => {
    async function logView() {
      const token = await getToken();
      if (!token) return;
      await fetch("/api/reading-history", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ articleId: article.id, completed: false }),
      }).catch(() => {});
    }
    logView();
  }, [article.id]);

  // Detect scroll to bottom → mark completed
  const handleCompletion = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    const token = await getToken();
    if (!token) return;
    await fetch("/api/reading-history", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ articleId: article.id, completed: true }),
    }).catch(() => {});
  }, [article.id]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const sentinel = el.querySelector("[data-sentinel]");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { handleCompletion(); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleCompletion]);

  // Tone change — fetch rewrite if not cached
  async function handleToneChange(newTone) {
    setSelectedTone(newTone);
    if (newTone === "CONVERSATIONAL") return;

    const key = `${activeLayer}_${newTone}`;
    if (toneCache[key]) return;

    const content = baseContent[activeLayer];
    if (!content) return;

    setToneLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/articles/${article.id}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tone: newTone, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setToneCache((prev) => ({ ...prev, [key]: data.content }));
      }
    } catch (err) {
      console.error("Tone rewrite failed:", err);
    } finally {
      setToneLoading(false);
    }
  }

  // When layer changes, fetch rewrite for that layer if tone is non-default
  async function handleLayerChange(newLayer) {
    setActiveLayer(newLayer);
    if (selectedTone === "CONVERSATIONAL") return;

    const key = `${newLayer}_${selectedTone}`;
    if (toneCache[key]) return;

    const content = baseContent[newLayer];
    if (!content) return;

    setToneLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/articles/${article.id}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tone: selectedTone, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setToneCache((prev) => ({ ...prev, [key]: data.content }));
      }
    } catch (err) {
      console.error("Tone rewrite failed:", err);
    } finally {
      setToneLoading(false);
    }
  }

  // Reaction
  async function handleReaction(value) {
    const newReaction = reaction === value ? null : value;
    setReaction(newReaction);
    const token = await getToken();
    if (!token) return;
    await fetch("/api/reading-history", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ articleId: article.id, reaction: newReaction }),
    }).catch(() => {});
  }

  const bookmarked = isBookmarked(article.id);

  return (
    <article className="max-w-2xl mx-auto px-4 py-8">
      {/* Hero image */}
      <div className="aspect-video relative rounded-2xl overflow-hidden mb-6">
        {article.imageUrl && !imageError ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${topicMeta.gradient} flex items-center justify-center`}>
            <span className="text-7xl">{topicMeta.emoji}</span>
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <span className="font-medium">{article.source}</span>
          <span>·</span>
          <span>{timeAgo(article.publishedAt)}</span>
          <span>·</span>
          <span>{estimateReadTime(article.simplifiedBody)}</span>
          {primaryTopic && (
            <>
              <span>·</span>
              <Badge topic={primaryTopic} label={topicMeta.label} />
            </>
          )}
        </div>

        {/* Bookmark button */}
        <button
          onClick={() => toggleBookmark(article.id)}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
          className={`flex-shrink-0 p-2 rounded-xl transition-colors ${
            bookmarked
              ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-5">
        {article.title}
      </h1>

      {/* Why it matters */}
      {article.whyItMatters && (
        <div className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 mb-6 rounded-r-xl">
          <p className="text-sm text-amber-900 font-medium">{article.whyItMatters}</p>
        </div>
      )}

      {/* Layer toggle + Tone selector */}
      <div className="flex flex-col gap-3">
        <LayerToggle activeLayer={activeLayer} onChange={handleLayerChange} />
        <ToneSelector selected={selectedTone} onChange={handleToneChange} loading={toneLoading} />
      </div>

      {/* Content */}
      <div ref={contentRef} className="mt-6 prose-lumi">
        {displayContent ? (
          displayContent.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))
        ) : (
          <p className="text-gray-400 italic">Content not yet available.</p>
        )}
        <div data-sentinel aria-hidden="true" />
      </div>

      {/* Reactions */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-3">How was this story?</p>
        <div className="flex gap-2">
          {REACTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => handleReaction(r.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                reaction === r.value
                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
              }`}
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rabbit hole */}
      {article.rabbitHole && (
        <div className="mt-8">
          <RabbitHole content={article.rabbitHole} />
        </div>
      )}

      {/* Source link */}
      {article.sourceUrl && (
        <div className="mt-10 pt-6 border-t border-gray-100">
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1"
          >
            Read original article <span aria-hidden>→</span>
          </a>
        </div>
      )}

      {/* Back to feed */}
      <div className="mt-4">
        <Link href="/feed" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
          <span aria-hidden>←</span> Back to feed
        </Link>
      </div>
    </article>
  );
}
