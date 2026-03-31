import React from 'react';
import { BookOpen, Brain, Search, Network, Folder, Plus, Mic, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

export default function Help() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="mb-10">
        <h1 className="text-4xl font-bold text-zinc-100 mb-4 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-zinc-400" />
          How to Use Second Brain
        </h1>
        <p className="text-xl text-zinc-400">
          Your guide to saving, organizing, and connecting your knowledge using AI.
        </p>
      </motion.header>

      <div className="space-y-6">
        {/* Section 1: Adding Knowledge */}
        <motion.section variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
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
        </motion.section>

        {/* Section 2: Voice Journal */}
        <motion.section variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Mic className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">2. Voice Journal</h2>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                Capture your thoughts on the go using the Voice Journal feature.
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2">
                <li>Click the <strong>Microphone</strong> icon in the Add Content modal or navigate to the Journal page.</li>
                <li>Speak your mind, and the AI will transcribe your speech in real-time.</li>
                <li>Save your transcript directly to your Second Brain for future reference.</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Section 3: AI Assistant */}
        <motion.section variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">3. AI Assistant</h2>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                Chat directly with your knowledge base using the AI Assistant.
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-2">
                <li>Navigate to the <strong>Chat</strong> page.</li>
                <li>Ask questions about anything you've saved in your Second Brain.</li>
                <li>The AI will synthesize answers based entirely on your personal knowledge base.</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Section 4: Dashboard */}
        <motion.section variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">4. The Dashboard</h2>
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
        </motion.section>

        {/* Section 5: Semantic Search */}
        <motion.section variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Search className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">5. AI Semantic Search</h2>
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
        </motion.section>

        {/* Section 6: Knowledge Graph */}
        <motion.section variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Network className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">6. Visualizing Connections</h2>
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
        </motion.section>

        {/* Section 7: Collections */}
        <motion.section variants={itemVariants} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Folder className="w-6 h-6 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-3">7. Managing Collections</h2>
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
        </motion.section>
      </div>
    </motion.div>
  );
}
