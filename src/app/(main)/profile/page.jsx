"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import TopicDeck from "@/components/onboarding/TopicDeck";

const TONE_OPTIONS = [
  { value: "FORMAL",         label: "Formal",         description: "Professional, journalistic tone" },
  { value: "CONVERSATIONAL", label: "Conversational",  description: "Clear and easy to read" },
  { value: "LIKE_A_FRIEND",  label: "Like a friend",   description: "Casual, warm — like a text from someone who knows things" },
];

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const { requestPermission, disableNotifications } = useNotifications(user);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [tone, setTone] = useState("CONVERSATIONAL");
  const [streak, setStreak] = useState(0);
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const token = await auth.currentUser.getIdToken();

      const [prefsRes, bookmarksRes] = await Promise.all([
        fetch("/api/preferences", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/bookmarks",   { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (prefsRes.ok) {
        const data = await prefsRes.json();
        setSelectedTopics(data.preferences.map((p) => p.topicSlug));
      }

      if (bookmarksRes.ok) {
        const data = await bookmarksRes.json();
        setBookmarkedArticles(data.articles || []);
      }
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setBookmarksLoading(false);
    }
  }, [user]);

  // Load Firestore user doc for streak + tone
  const loadUserDoc = useCallback(async () => {
    if (!user) return;
    const { getDoc, doc: fsDoc } = await import("firebase/firestore");
    const snap = await getDoc(fsDoc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      setStreak(data.readingStreak || 0);
      setTone(data.tonePreference || "CONVERSATIONAL");
      setNotificationsOn(data.notificationsOn || false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    loadData();
    loadUserDoc();
  }, [user, loading, router, loadData, loadUserDoc]);

  function toggleTopic(slug) {
    setSelectedTopics((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topics: selectedTopics }),
      });
      if (!res.ok) throw new Error("Failed to save topics");

      await updateDoc(doc(db, "users", user.uid), { tonePreference: tone });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/login");
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">

      {/* User info + streak */}
      <div className="flex items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || "User"} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-600">
              {(user.displayName || user.email || "U")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 text-lg">{user.displayName || "Reader"}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Streak badge */}
        <div className="flex flex-col items-center bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-bold text-amber-600">{streak}</span>
          <span className="text-xs text-amber-500">day streak</span>
        </div>
      </div>

      {/* Bookmarks */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Saved articles</h2>
        {bookmarksLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : bookmarkedArticles.length === 0 ? (
          <p className="text-sm text-gray-400">No saved articles yet. Bookmark stories while reading.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bookmarkedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="flex flex-col gap-0.5 p-3 rounded-xl bg-white border border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800 line-clamp-2">{article.title}</p>
                <p className="text-xs text-gray-400">{article.source}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Topics */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Your topics</h2>
        <p className="text-sm text-gray-500 mb-4">Toggle topics to update your feed.</p>
        <TopicDeck selected={selectedTopics} onToggle={toggleTopic} />
      </section>

      {/* Tone */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Reading tone</h2>
        <p className="text-sm text-gray-500 mb-4">How would you like articles written?</p>
        <div className="flex flex-col gap-2">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setTone(option.value)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                tone === option.value
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                tone === option.value ? "border-amber-500 bg-amber-500" : "border-gray-300"
              }`} />
              <div>
                <p className={`font-medium text-sm ${tone === option.value ? "text-amber-700" : "text-gray-800"}`}>
                  {option.label}
                </p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Notifications</h2>
        <p className="text-sm text-gray-500 mb-4">
          Get a morning briefing with your top story of the day.
        </p>
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-800">Morning briefing</p>
            <p className="text-xs text-gray-400">
              {notificationsOn ? "Enabled — you'll receive daily updates" : "Disabled"}
            </p>
          </div>
          <button
            disabled={notifLoading}
            onClick={async () => {
              setNotifLoading(true);
              try {
                if (notificationsOn) {
                  await disableNotifications();
                  setNotificationsOn(false);
                } else {
                  const granted = await requestPermission();
                  if (granted) setNotificationsOn(true);
                }
              } finally {
                setNotifLoading(false);
              }
            }}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
              notificationsOn ? "bg-amber-500" : "bg-gray-200"
            }`}
            aria-label="Toggle notifications"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                notificationsOn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Save */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}
      <button
        onClick={handleSave}
        disabled={saving || selectedTopics.length < 1}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4"
      >
        {saving ? "Saving…" : saved ? "Saved!" : "Save preferences"}
      </button>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full py-3 rounded-xl font-medium text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
