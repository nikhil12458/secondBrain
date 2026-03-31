import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToItems } from '../services/db';
import { generateEmbeddings } from '../services/ai';
import { Search as SearchIcon, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default function Search() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedExplanation, setExpandedExplanation] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const unsub = subscribeToItems(user.uid, (data) => {
      setItems(data);
    });

    return () => unsub();
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const queryEmbedding = await generateEmbeddings(query);
      
      if (queryEmbedding.length === 0) {
        const textResults = items.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) || 
          item.content.toLowerCase().includes(query.toLowerCase()) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        ).map(item => ({ item, score: 1 }));
        setResults(textResults);
        return;
      }

      const scoredItems = items.map(item => {
        const score = item.embedding 
          ? cosineSimilarity(queryEmbedding, item.embedding)
          : 0;
        return { item, score };
      });

      const sortedResults = scoredItems
        .filter(r => r.score > 0.5)
        .sort((a, b) => b.score - a.score);

      setResults(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Semantic Search</h1>
        <p className="text-zinc-400">Find anything in your brain using natural language.</p>
      </header>

      <form onSubmit={handleSearch} className="relative max-w-2xl flex flex-col sm:block gap-2">
        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 sm:pr-32 py-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 text-lg shadow-sm"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSearching || !query.trim()}
          className="sm:absolute sm:right-2 sm:top-1/2 sm:-translate-y-1/2 w-full sm:w-auto bg-zinc-100 text-zinc-900 px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
          Search
        </motion.button>
      </form>

      <div className="space-y-4 max-w-3xl">
        {results.map(({ item, score }, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ y: -2, scale: 1.01 }}
            key={item.id} 
            onClick={() => navigate(`/item/${item.id}`)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/50 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-zinc-100 text-lg">{item.title}</h3>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded">
                Match: {(score * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{item.summary || item.content}</p>
            
            {item.explanation && (
              <div className="mb-4">
                <button
                  onClick={() => setExpandedExplanation(expandedExplanation === item.id ? null : item.id)}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {expandedExplanation === item.id ? 'Hide AI Explanation' : 'Explain with AI'}
                </button>
                {expandedExplanation === item.id && (
                  <div className="mt-2 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg text-sm text-indigo-200/90 leading-relaxed">
                    {item.explanation}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {item.tags?.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}

        {results.length === 0 && query && !isSearching && (
          <div className="text-zinc-500 text-center py-12">
            No results found for "{query}". Try a different search term.
          </div>
        )}
      </div>
    </div>
  );
}
