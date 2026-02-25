"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);

  // Already logged in — redirect away
  useEffect(() => {
    if (user) {
      router.replace("/feed");
    }
  }, [user, router]);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { uid, email, displayName, photoURL } = result.user;

      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // First time — create user document
        await setDoc(userRef, {
          email,
          name: displayName || "",
          photoURL: photoURL || "",
          onboardingDone: false,
          notificationsOn: false,
          tonePreference: "CONVERSATIONAL",
          readingStreak: 0,
          createdAt: serverTimestamp(),
        });
        router.replace("/onboarding");
      } else {
        const data = snap.data();
        router.replace(data.onboardingDone ? "/feed" : "/onboarding");
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      setError("Sign-in failed. Please try again.");
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">
            Lumi <span className="text-amber-500">✦</span>
          </h1>
          <p className="text-gray-500 text-base">News that actually makes sense to you.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to get a personalised news feed curated just for you.
          </p>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* Google icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {signingIn ? "Signing in…" : "Continue with Google"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in you agree to our Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
}
