"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import TopicDeck from "@/components/onboarding/TopicDeck";
import Link from "next/link";
import Image from "next/image";
import { getTopicMeta } from "@/lib/utils";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [previewArticles, setPreviewArticles] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  function toggleTopic(slug) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleStart() {
    if (selected.length < 3) return;
    setSaving(true);
    setError(null);

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topics: selected }),
      });

      if (!res.ok) throw new Error("Failed to save preferences");

      await updateDoc(doc(db, "users", user.uid), { onboardingDone: true });

      // Fetch a few articles to preview
      const feedRes = await fetch(`/api/feed?mode=foryou`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (feedRes.ok) {
        const data = await feedRes.json();
        setPreviewArticles((data.articles || []).slice(0, 3));
      }

      setDone(true);
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Completion screen
  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your feed is ready</h1>
            <p className="text-gray-500">
              Here's a taste of what's waiting for you.
            </p>
          </div>

          {previewArticles.length > 0 && (
            <div className="space-y-3 mb-8">
              {previewArticles.map((article) => {
                const topicMeta = getTopicMeta(article.topicTags?.[0]);
                return (
                  <div key={article.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex gap-3 p-3 shadow-sm">
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative">
                      {article.imageUrl ? (
                        <Image src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${topicMeta.gradient} flex items-center justify-center`}>
                          <span className="text-2xl">{topicMeta.emoji}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{article.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{article.source}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href="/feed"
            className="block w-full py-4 rounded-2xl font-semibold text-base text-center bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98] transition-all"
          >
            Start Reading →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            What do you care about?
          </h1>
          <p className="text-gray-500">
            Pick at least 3 topics — your feed will be personalised around them.
          </p>
        </div>

        {/* Selection counter */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {selected.length} of 10 selected
          </span>
          {selected.length > 0 && selected.length < 3 && (
            <span className="text-sm text-amber-600">Pick {3 - selected.length} more</span>
          )}
        </div>

        {/* Topic grid */}
        <TopicDeck selected={selected} onToggle={toggleTopic} />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mt-4">{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={selected.length < 3 || saving}
          className="mt-8 w-full py-4 rounded-2xl font-semibold text-base transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]"
        >
          {saving ? "Setting up your feed…" : "Start Reading"}
        </button>
      </div>
    </div>
  );
}
