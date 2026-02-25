import { TOPIC_COLORS } from "@/lib/utils";

export default function Badge({ topic, label, onClick }) {
  const colors = TOPIC_COLORS[topic] || { bg: "bg-gray-100", text: "text-gray-700" };
  const className = `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} transition-opacity`;

  if (onClick) {
    return (
      <button onClick={onClick} className={`${className} hover:opacity-80 cursor-pointer`}>
        {label}
      </button>
    );
  }

  return <span className={className}>{label}</span>;
}
