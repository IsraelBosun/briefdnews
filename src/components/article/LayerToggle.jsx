"use client";

const LAYERS = [
  { id: "summary", label: "Summary" },
  { id: "full", label: "Full Story" },
  { id: "deep", label: "Deep Dive" },
];

export default function LayerToggle({ activeLayer, onChange }) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-full w-fit">
      {LAYERS.map((layer) => (
        <button
          key={layer.id}
          onClick={() => onChange(layer.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeLayer === layer.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {layer.label}
        </button>
      ))}
    </div>
  );
}
