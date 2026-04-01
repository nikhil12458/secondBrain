import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, FileText, Share2, PenTool, BookOpen, Twitter, Linkedin, GraduationCap, Network } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

export default function AIActions({ item }) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [generatedContent, setGeneratedContent] = useState('');

  const handleAction = async (actionType, prompt) => {
    setLoading(true);
    setActiveAction(actionType);
    setGeneratedContent('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const fullPrompt = `
        Based on the following content titled "${item.title}":
        
        ${item.content}
        
        ${prompt}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
      });

      setGeneratedContent(response.text);
    } catch (error) {
      console.error('AI Generation Error:', error);
      setGeneratedContent('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      category: 'Auto-generate',
      items: [
        { id: 'notes', label: 'Notes', icon: FileText, prompt: 'Generate concise and structured notes from this content. Use bullet points and highlight key concepts.' },
        { id: 'mindmap', label: 'Mind map', icon: Network, prompt: 'Create a text-based mind map representing the core ideas and their relationships in this content. Use indentation to show hierarchy.' },
        { id: 'blog', label: 'Blog draft', icon: PenTool, prompt: 'Write a compelling blog post draft based on this content. Include an engaging title, introduction, main body paragraphs with headings, and a conclusion.' },
      ]
    },
    {
      category: 'Convert this into',
      items: [
        { id: 'twitter', label: 'Twitter thread', icon: Twitter, prompt: 'Convert this content into an engaging Twitter thread. Use emojis, keep each tweet under 280 characters, and number the tweets (e.g., 1/5).' },
        { id: 'linkedin', label: 'LinkedIn post', icon: Linkedin, prompt: 'Convert this content into a professional LinkedIn post. Use a strong hook, break up the text for readability, and include relevant hashtags at the end.' },
        { id: 'study', label: 'Study notes', icon: GraduationCap, prompt: 'Convert this content into study notes. Include a summary, key terms with definitions, and 3-5 practice questions to test understanding.' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          AI Actions
        </h2>
        
        <div className="space-y-6">
          {actions.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">{group.category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {group.items.map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction(action.id, action.prompt)}
                      disabled={loading}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                        activeAction === action.id
                          ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {action.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(loading || generatedContent) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-zinc-400 animate-pulse">Generating content...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <h3 className="text-lg font-medium text-zinc-100 capitalize">
                    Generated {activeAction?.replace('-', ' ')}
                  </h3>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedContent);
                      // Could add a toast here
                    }}
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Share2 className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="prose prose-invert max-w-none text-zinc-300">
                  <div className="markdown-body">
                    <Markdown>{generatedContent}</Markdown>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
