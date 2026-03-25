import React from 'react';
import { BookOpen, Brain, Search, Network, Folder, Plus } from 'lucide-react';

export default function Help() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-zinc-100 mb-4 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-zinc-400" />
          How to Use Second Brain
        </h1>
        <p className="text-xl text-zinc-400">
          Your guide to saving, organizing, and connecting your knowledge using AI.
        </p>
      </header>

      <div className="space-y-6">
        {/* Section 1: Adding Knowledge */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">1. Adding Knowledge</h2>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                Start by feeding information into your Second Brain. Click the <strong>"Add Content"</strong> button in the sidebar to create a new entry.
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2">
                <li>Paste articles, notes, thoughts, or ideas.</li>
                <li>When you save, our AI automatically reads your content.</li>
                <li>The AI generates a <strong>concise summary</strong> and <strong>smart tags</strong> to categorize your entry without manual effort.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Dashboard */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">2. The Dashboard</h2>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                The Dashboard is your home base. Here you can see a chronological feed of all your saved knowledge.
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2">
                <li>Review AI-generated summaries at a glance.</li>
                <li>See which tags were automatically assigned to your notes.</li>
                <li>Click on any note to read the full original content.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Semantic Search */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Search className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">3. AI Semantic Search</h2>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                Standard search only looks for exact word matches. Your Second Brain uses <strong>AI Semantic Search</strong> to find meaning.
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2">
                <li>Navigate to the <strong>Search</strong> page.</li>
                <li>Type a question or a concept (e.g., "marketing strategies" or "how do habits work?").</li>
                <li>The AI compares the <em>meaning</em> of your search against all your notes and returns the most conceptually relevant results, even if the exact words don't match.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Knowledge Graph */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Network className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">4. Visualizing Connections</h2>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                Your knowledge isn't just a flat list; it's a network. The Knowledge Graph helps you discover hidden relationships.
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2">
                <li>Navigate to the <strong>Knowledge Graph</strong> page.</li>
                <li>See a visual web of your notes.</li>
                <li>Notes that share similar AI-generated tags or semantic meaning are connected by lines.</li>
                <li>Explore clusters of related ideas to spark new insights.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5: Collections */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Folder className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">5. Managing Collections</h2>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                Sometimes you want to browse specific topics at a high level.
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2">
                <li>Navigate to the <strong>Collections</strong> page.</li>
                <li>See your notes grouped automatically by their AI-generated tags.</li>
                <li>Click on a tag to see all notes related to that specific topic.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
