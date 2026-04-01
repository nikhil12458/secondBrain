import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../hooks/useFeatures';
import { subscribeToCollections, createCollection, toggleCollectionPublic } from '../services/db';
import { Plus, Globe, Lock, Loader2, Copy, Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Collections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFeatureEnabled } = useFeatures();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const unsub = subscribeToCollections(user.uid, (data) => {
      setCollections(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setSubmitting(true);
    try {
      await createCollection(user.uid, newName, newDesc);
      setNewName('');
      setNewDesc('');
      setShowAdd(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create collection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublic = async (collection) => {
    try {
      await toggleCollectionPublic(collection.id, !collection.isPublic);
    } catch (err) {
      console.error(err);
      alert('Failed to update collection visibility');
    }
  };

  const copyLink = (collectionId) => {
    const url = `${window.location.origin}/c/${collectionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(collectionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>;
  }

  const canMakePublic = isFeatureEnabled('publicCollections');

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Collections</h1>
          <p className="text-zinc-400">Organize your knowledge into curated spaces.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAdd(true)}
          className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </motion.button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden"
          >
            <h2 className="text-xl font-semibold mb-4">Create Collection</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-zinc-100 text-zinc-900 px-6 py-2 rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.01 }}
            key={collection.id} 
            onClick={() => navigate(`/c/${collection.id}`)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col hover:border-zinc-700 hover:shadow-xl hover:shadow-black/50 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {collection.name}
                  {collection.isAutoGenerated && (
                    <span className="text-[10px] uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Auto
                    </span>
                  )}
                </h3>
              </div>
              {canMakePublic && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleTogglePublic(collection); }}
                  className={`p-2 rounded-lg transition-colors ${collection.isPublic ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                  title={collection.isPublic ? "Make Private" : "Publish"}
                >
                  {collection.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
              )}
            </div>
            <p className="text-zinc-400 text-sm mb-6 flex-1">
              {collection.description || 'No description'}
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800">
              <span className="text-sm text-zinc-500">
                {collection.itemIds?.length || 0} items
              </span>
              <div className="flex items-center gap-2">
                {canMakePublic && (
                  <button
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      if (!collection.isPublic) {
                        await handleTogglePublic(collection);
                      }
                      copyLink(collection.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors text-sm font-medium"
                  >
                    {copiedId === collection.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copiedId === collection.id ? 'Copied!' : 'Share'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {collections.length === 0 && !showAdd && (
          <div className="col-span-full flex items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
            <p>You haven't created any collections yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
