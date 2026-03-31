import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPublicCollection } from '../services/db';
import { Loader2, ExternalLink, FileText, Video, Image as ImageIcon, File, Hash, MessageSquare, Sparkles, Mic } from 'lucide-react';
import { motion } from 'motion/react';

const TypeIcon = ({ type }) => {
  switch (type) {
    case 'article': return <FileText className="w-5 h-5 text-blue-400" />;
    case 'video': return <Video className="w-5 h-5 text-red-400" />;
    case 'image': return <ImageIcon className="w-5 h-5 text-green-400" />;
    case 'pdf': return <File className="w-5 h-5 text-orange-400" />;
    case 'social': return <MessageSquare className="w-5 h-5 text-pink-400" />;
    case 'journal': return <Mic className="w-5 h-5 text-purple-400" />;
    default: return <FileText className="w-5 h-5 text-zinc-400" />;
  }
};

export default function PublicCollection() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedExplanation, setExpandedExplanation] = useState(null);

  useEffect(() => {
    getPublicCollection(collectionId)
      .then(setData)
      .catch(err => {
        console.error(err);
        setError('Collection not found or is private.');
      })
      .finally(() => setLoading(false));
  }, [collectionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-zinc-400 mb-6">{error}</p>
        <Link to="/" className="bg-zinc-800 text-zinc-100 px-4 py-2 rounded-lg hover:bg-zinc-700">
          Go to Homepage
        </Link>
      </div>
    );
  }

  const { collection, items } = data;

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-zinc-800 pb-8"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-4">{collection.name}</h1>
          {collection.description && (
            <p className="text-xl text-zinc-400">{collection.description}</p>
          )}
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              key={item.id} 
              onClick={() => navigate(`/item/${item.id}`)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                    <TypeIcon type={item.type} />
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
                </div>
                {item.url && (
                  <motion.a
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </motion.a>
                )}
              </div>
              
              <p className="text-zinc-400 text-sm mb-6 flex-1 line-clamp-3">
                {item.summary || item.content}
              </p>

              {item.explanation && (
                <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); setExpandedExplanation(expandedExplanation === item.id ? null : item.id); }}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {expandedExplanation === item.id ? 'Hide AI Explanation' : 'Explain with AI'}
                  </motion.button>
                  {expandedExplanation === item.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 p-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg text-sm text-indigo-200/90 leading-relaxed"
                    >
                      {item.explanation}
                    </motion.div>
                  )}
                </div>
              )}
              
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-zinc-800/50">
                  {item.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                      <Hash className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          
          {items.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500"
            >
              <p>This collection is empty.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
