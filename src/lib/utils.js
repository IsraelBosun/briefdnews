import { TOPICS } from "@/constants/topics";

export const TOPIC_COLORS = {
  nigeria:       { bg: "bg-amber-100",   text: "text-amber-800",   gradient: "from-amber-400 to-amber-600",    emoji: "🇳🇬" },
  africa:        { bg: "bg-green-100",   text: "text-green-800",   gradient: "from-green-400 to-green-600",    emoji: "🌍" },
  world:         { bg: "bg-sky-100",     text: "text-sky-800",     gradient: "from-sky-400 to-sky-600",        emoji: "🌐" },
  politics:      { bg: "bg-red-100",     text: "text-red-800",     gradient: "from-red-400 to-red-600",        emoji: "🏛️" },
  business:      { bg: "bg-blue-100",    text: "text-blue-800",    gradient: "from-blue-400 to-blue-600",      emoji: "💼" },
  technology:    { bg: "bg-violet-100",  text: "text-violet-800",  gradient: "from-violet-400 to-violet-600",  emoji: "🤖" },
  startups:      { bg: "bg-orange-100",  text: "text-orange-800",  gradient: "from-orange-400 to-orange-600",  emoji: "🚀" },
  finance:       { bg: "bg-yellow-100",  text: "text-yellow-800",  gradient: "from-yellow-400 to-yellow-600",  emoji: "💰" },
  sports:        { bg: "bg-emerald-100", text: "text-emerald-800", gradient: "from-emerald-400 to-emerald-600",emoji: "⚽" },
  entertainment: { bg: "bg-pink-100",    text: "text-pink-800",    gradient: "from-pink-400 to-pink-600",      emoji: "🎬" },
  culture:       { bg: "bg-purple-100",  text: "text-purple-800",  gradient: "from-purple-400 to-purple-600",  emoji: "🎭" },
  health:        { bg: "bg-teal-100",    text: "text-teal-800",    gradient: "from-teal-400 to-teal-600",      emoji: "🏥" },
  science:       { bg: "bg-indigo-100",  text: "text-indigo-800",  gradient: "from-indigo-400 to-indigo-600",  emoji: "🔬" },
  environment:   { bg: "bg-lime-100",    text: "text-lime-800",    gradient: "from-lime-400 to-lime-600",      emoji: "🌿" },
  education:     { bg: "bg-cyan-100",    text: "text-cyan-800",    gradient: "from-cyan-400 to-cyan-600",      emoji: "📚" },
  crime:         { bg: "bg-rose-100",    text: "text-rose-800",    gradient: "from-rose-400 to-rose-600",      emoji: "🔒" },
};

export function getTopicMeta(slug) {
  const topic = TOPICS.find((t) => t.slug === slug);
  const colors = TOPIC_COLORS[slug] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    gradient: "from-gray-400 to-gray-600",
    emoji: "📰",
  };
  return { slug, label: topic?.label ?? slug, ...colors };
}

export function timeAgo(isoString) {
  if (!isoString) return "";
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function estimateReadTime(text) {
  if (!text) return "1 min read";
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

export function serializeArticle(doc) {
  const id = doc.id;
  const data = typeof doc.data === "function" ? doc.data() : doc;
  return {
    id,
    sourceUrl: data.sourceUrl || null,
    title: data.title || "",
    source: data.source || "",
    publishedAt: data.publishedAt?.toDate?.().toISOString() ?? data.publishedAt ?? null,
    imageUrl: data.imageUrl || null,
    summary: data.summary || null,
    simplifiedBody: data.simplifiedBody || null,
    deepDive: data.deepDive || null,
    whyItMatters: data.whyItMatters || null,
    rabbitHole: data.rabbitHole || null,
    topicTags: data.topicTags || [],
    entities: data.entities || [],
    weightScore: data.weightScore ?? 0.5,
    processedAt: data.processedAt?.toDate?.().toISOString() ?? data.processedAt ?? null,
  };
}
