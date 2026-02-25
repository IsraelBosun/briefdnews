"use client";

const TONES = [
  { value: "CONVERSATIONAL", label: "Default" },
  { value: "FORMAL",         label: "Formal" },
  { value: "LIKE_A_FRIEND",  label: "Like a friend" },
];

export default function ToneSelector({ selected, onChange, loading }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400">Tone:</span>
      <div className="flex gap-1">
        {TONES.map((tone) => (
          <button
            key={tone.value}
            onClick={() => onChange(tone.value)}
            disabled={loading}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all disabled:opacity-50 ${
              selected === tone.value
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tone.label}
          </button>
        ))}
      </div>
      {loading && (
        <span className="text-xs text-gray-400 animate-pulse">Rewriting…</span>
      )}
    </div>
  );
}
