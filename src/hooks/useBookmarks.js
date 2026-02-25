"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useBookmarks(user) {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setBookmarks(snap.data()?.bookmarks || []);
    });
    return unsubscribe;
  }, [user]);

  async function toggleBookmark(articleId) {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    if (bookmarks.includes(articleId)) {
      await updateDoc(userRef, { bookmarks: arrayRemove(articleId) });
    } else {
      await updateDoc(userRef, { bookmarks: arrayUnion(articleId) });
    }
  }

  return {
    bookmarks,
    isBookmarked: (id) => bookmarks.includes(id),
    toggleBookmark,
  };
}
