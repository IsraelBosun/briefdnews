"use client";

import { useState } from "react";

export default function RabbitHole({ content }) {
  const [open, setOpen] = useState(false);

  if (!content) return null;

  const questionIdx = content.indexOf("?");
  const question =
    questionIdx !== -1 ? content.slice(0, questionIdx + 1) : "Curious to learn more?";
  const answer =
    questionIdx !== -1 ? content.slice(questionIdx + 1).trim() : content;

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span>🐇</span>
          <span className="text-sm font-semibold text-amber-900">Rabbit Hole</span>
        </div>
        <span className="text-amber-600 text-lg leading-none">{open ? "↑" : "↓"}</span>
      </button>

      {open && (
        <div className="px-4 py-4 bg-white">
          <p className="font-semibold text-gray-900 mb-2">{question}</p>
          <p className="text-gray-600 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
