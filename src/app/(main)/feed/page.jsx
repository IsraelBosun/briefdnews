"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import TopicFilter from "@/components/feed/TopicFilter";
import FeedSection from "@/components/feed/FeedSection";

function FeedContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || null;

  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchFeed = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await auth.currentUser.getIdToken();
        const url = selectedTopic ? `/api/feed?topic=${selectedTopic}` : "/api/feed";
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
    };

    fetchFeed();
  }, [selectedTopic, user, router]);

  return (
    <>
      <div className="mb-6">
        <TopicFilter selected={selectedTopic} onChange={setSelectedTopic} />
      </div>
      <FeedSection articles={articles} isLoading={isLoading} error={error} />
    </>
  );
}

export default function FeedPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Feed</h1>
        <p className="text-sm text-gray-500">Today{"'"}s top stories, simplified.</p>
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
