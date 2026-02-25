"use client";

import { TOPICS } from "@/constants/topics";
import { TOPIC_COLORS } from "@/lib/utils";

export default function TopicFilter({ selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* All topics */}
      <button
        onClick={() => onChange(null)}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
          selected === null
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        All
      </button>

      {TOPICS.map((topic) => {
        const colors = TOPIC_COLORS[topic.slug];
        const isActive = selected === topic.slug;
        return (
          <button
            key={topic.slug}
            onClick={() => onChange(topic.slug)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              isActive
                ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-current`
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span>{topic.emoji}</span>
            <span>{topic.label}</span>
          </button>
        );
      })}
    </div>
  );
}
