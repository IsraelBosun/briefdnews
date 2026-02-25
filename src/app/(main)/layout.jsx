"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400"
        aria-label="User menu"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-600">
            {(user.displayName || user.email || "U")[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Profile & Preferences
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function MainLayout({ children }) {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Persistent nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-amber-600 transition-colors">
            Lumi <span className="text-amber-500">✦</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/feed"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Feed
            </Link>
            <Link
              href="/digest"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Digest
            </Link>

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <UserMenu user={user} />
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        Built by{" "}
        <a
          href="https://bluehydradev.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-500 hover:text-amber-600 font-medium transition-colors"
        >
          BlueHydra Labs
        </a>
      </footer>
    </div>
  );
}
