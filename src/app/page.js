import Link from "next/link";
import { TOPICS } from "@/constants/topics";

const FEATURES = [
  {
    icon: "⚡",
    title: "60-Second Reads",
    description:
      "Every article distilled into a clear, jargon-free summary you can actually finish. No walls of text.",
  },
  {
    icon: "🎯",
    title: "Personalised For You",
    description:
      "The more you read, the smarter your feed gets. Lumi learns what topics matter to you.",
  },
  {
    icon: "🧠",
    title: "Go Deeper, On Demand",
    description:
      "Switch between Summary, Full Story, and Deep Dive. Plus a Rabbit Hole section to satisfy your curiosity.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            Lumi <span className="text-amber-500">✦</span>
          </span>
          <Link
            href="/login"
            className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            Browse Feed
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span>✦</span> AI-powered news for real people
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          News that actually{" "}
          <span className="text-amber-500">makes sense</span>{" "}
          to you.
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Lumi takes the headlines, strips the noise, and gives you the story in plain
          language — with as much depth as you want.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-amber-500 text-white px-8 py-3.5 rounded-full font-semibold text-base hover:bg-amber-600 transition-colors shadow-md"
          >
            Get Started Free →
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto bg-white text-gray-700 px-8 py-3.5 rounded-full font-semibold text-base border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            How it works
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
          Built for people who hate reading the news
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Topics preview */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
          Choose what you care about
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/feed?topic=${topic.slug}`}
              className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-colors shadow-sm"
            >
              <span>{topic.emoji}</span>
              <span>{topic.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Stay informed. Stay sane.
        </h2>
        <p className="text-gray-500 mb-8">
          Sign in with Google — it{"'"}s free. Your personalised feed is ready in seconds.
        </p>
        <Link
          href="/login"
          className="bg-amber-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-amber-600 transition-colors shadow-lg inline-block"
        >
          Get Started Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>
          <span className="font-semibold text-gray-700">Lumi</span> — News that actually makes
          sense to you.
        </p>
        <p className="mt-2 text-xs">
          Built by{" "}
          <a
            href="https://bluehydradev.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:text-amber-600 font-medium transition-colors"
          >
            BlueHydra Labs
          </a>
        </p>
      </footer>
    </div>
  );
}
