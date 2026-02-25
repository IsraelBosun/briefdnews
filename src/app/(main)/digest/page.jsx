"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import WeeklyDigest from "@/components/digest/WeeklyDigest";

function DigestSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-8 w-56 bg-gray-200 rounded mb-8" />
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-10">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
          <div className="flex flex-col gap-3">
            {[1, 2].map((j) => (
              <div key={j} className="h-20 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DigestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [digest, setDigest] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchDigest() {
      setFetching(true);
      setError(null);
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/api/digest", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { router.replace("/login"); return; }
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        setDigest(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    }

    fetchDigest();
  }, [user, router]);

  if (loading || fetching) return <DigestSkeleton />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Failed to load digest: {error}</p>
      </div>
    );
  }

  if (!digest) return null;

  return <WeeklyDigest byTopic={digest.byTopic} stats={digest.stats} />;
}
