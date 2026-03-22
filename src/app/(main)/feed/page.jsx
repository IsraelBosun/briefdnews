"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import TopicFilter from "@/components/feed/TopicFilter";
import FeedSection from "@/components/feed/FeedSection";
import SearchBar from "@/components/feed/SearchBar";

const FEED_MODES = [
  { id: "foryou", label: "For You" },
  { id: "latest", label: "Latest" },
];

// How long (ms) before showing the "new stories" banner
const REFRESH_DELAY = 5 * 60 * 1000;

function FeedContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || null;

  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [feedMode, setFeedMode] = useState("foryou");
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const [streak, setStreak] = useState(null);

  const { user, loading } = useAuth();
  const router = useRouter();
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    setShowRefreshBanner(false);

    // Reset refresh timer
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => setShowRefreshBanner(true), REFRESH_DELAY);

    try {
      const token = await auth.currentUser.getIdToken();
      let url = `/api/feed?mode=${feedMode}`;
      if (selectedTopic) url += `&topic=${selectedTopic}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTopic, feedMode, user, router]);

  // Fetch streak separately
  useEffect(() => {
    if (!user) return;
    import("firebase/firestore").then(({ doc, getDoc }) => {
      import("@/lib/firebase").then(({ db }) => {
        getDoc(doc(db, "users", user.uid)).then((snap) => {
          if (snap.exists()) setStreak(snap.data().readingStreak || 0);
        });
      });
    });
  }, [user]);

  useEffect(() => {
    fetchFeed();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [fetchFeed]);

  return (
    <>
      {/* Refresh banner */}
      {showRefreshBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-sm text-amber-800 font-medium">New stories may be available</p>
          <button
            onClick={fetchFeed}
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Feed mode tabs */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
          {FEED_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setFeedMode(mode.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                feedMode === mode.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {streak !== null && streak > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            🔥 {streak} day streak
          </span>
        )}
      </div>

      <div className="mb-5">
        <TopicFilter selected={selectedTopic} onChange={setSelectedTopic} />
      </div>

      <FeedSection articles={articles} isLoading={isLoading} error={error} />
    </>
  );
}

export default function FeedPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Feed</h1>
          <p className="text-sm text-gray-500">Today{"'"}s top stories, simplified.</p>
        </div>
        <SearchBar />
      </div>

      <Suspense
        fallback={
          <div className="mb-6 h-10 animate-pulse bg-gray-200 rounded-full w-full" />
        }
      >
        <FeedContent />
      </Suspense>
    </div>
  );
}
