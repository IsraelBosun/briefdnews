"use client";

import { TOPICS } from "@/constants/topics";

export default function TopicDeck({ selected, onToggle }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {TOPICS.map((topic) => {
        const isSelected = selected.includes(topic.slug);
        return (
          <button
            key={topic.slug}
            onClick={() => onToggle(topic.slug)}
            className={`
              flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all
              ${
                isSelected
                  ? "border-amber-500 bg-amber-50 shadow-sm scale-[1.02]"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }
            `}
            aria-pressed={isSelected}
          >
            <span className="text-3xl" aria-hidden="true">{topic.emoji}</span>
            <span className={`text-sm font-medium text-center leading-tight ${isSelected ? "text-amber-700" : "text-gray-700"}`}>
              {topic.label}
            </span>
            {isSelected && (
              <span className="text-xs text-amber-600 font-semibold">Selected</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
