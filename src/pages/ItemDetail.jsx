import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItem, toggleItemPublic } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Image as ImageIcon, File, StickyNote, ExternalLink, Sparkles, MessageCircle, Loader2, ArrowLeft, Mic, Hash, Share2, Check, Globe, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import AIActions from '../components/AIActions';

const TypeIcon = ({ type }) => {
  switch (type) {
    case 'article': return <FileText className="w-6 h-6 text-blue-400" />;
    case 'image': return <ImageIcon className="w-6 h-6 text-green-400" />;
    case 'pdf': return <File className="w-6 h-6 text-orange-400" />;
    case 'social': return <MessageCircle className="w-6 h-6 text-pink-400" />;
    case 'journal': return <Mic className="w-6 h-6 text-purple-400" />;
    default: return <StickyNote className="w-6 h-6 text-yellow-400" />;
  }
};

export default function ItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!item.isPublic) {
      await toggleItemPublic(item.id, true);
      setItem(prev => ({ ...prev, isPublic: true }));
    }
    
    const url = `${window.location.origin}/shared/item/${item.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = async () => {
    const newIsPublic = !item.isPublic;
    await toggleItemPublic(item.id, newIsPublic);
    setItem(prev => ({ ...prev, isPublic: newIsPublic }));
  };

  useEffect(() => {
    getItem(itemId)
      .then(data => {
        // Simple authorization check: if user is not the owner and item is not public, deny access
        if (data.userId !== user?.uid && !data.isPublic) {
          setError('You do not have permission to view this item.');
        } else {
          setItem(data);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Item not found.');
      })
      .finally(() => setLoading(false));
  }, [itemId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-zinc-400 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="bg-zinc-800 text-zinc-100 px-4 py-2 rounded-lg hover:bg-zinc-700">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8 pb-12">
      <motion.button 
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-start justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <TypeIcon type={item.type} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">{item.title}</h1>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span className="capitalize">{item.type}</span>
                <span>•</span>
                <span>{item.createdAt?.toDate ? format(item.createdAt.toDate(), 'MMMM d, yyyy') : 'Recently'}</span>
                {item.url && (
                  <>
                    <span>•</span>
                    <motion.a 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Original
                    </motion.a>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {user?.uid === item.userId && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePublic}
                className={`p-2 rounded-lg transition-colors ${item.isPublic ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                title={item.isPublic ? "Make Private" : "Publish"}
              >
                {item.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors text-sm font-medium"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          )}
        </div>
      </motion.header>

      {item.type === 'image' && item.url && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl"
        >
          <img src={item.url} alt={item.title} className="w-full h-auto max-h-[600px] object-contain" referrerPolicy="no-referrer" />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-8"
        >
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-zinc-100">Content</h2>
            <div className="prose prose-invert max-w-none text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {item.content}
            </div>
          </section>

          <AIActions item={item} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-8"
        >
          {item.explanation && (
            <section className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Sparkles className="w-24 h-24" />
              </div>
              <h2 className="text-lg font-semibold mb-3 text-indigo-300 flex items-center gap-2 relative z-10">
                <Sparkles className="w-5 h-5" />
                AI Explanation
              </h2>
              <p className="text-indigo-200/90 text-sm leading-relaxed relative z-10">
                {item.explanation}
              </p>
            </section>
          )}

          {item.summary && (
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-3 text-zinc-100">Summary</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {item.summary}
              </p>
            </section>
          )}

          {item.tags && item.tags.length > 0 && (
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 text-zinc-100">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-lg">
                    <Hash className="w-3 h-3 text-zinc-500" />
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </div>
    </div>
  );
}
