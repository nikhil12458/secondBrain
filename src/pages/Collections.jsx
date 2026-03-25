import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCollections, createCollection, toggleCollectionPublic } from '../services/db';
import { Plus, Globe, Lock, Loader2, Copy } from 'lucide-react';

export default function Collections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    alert('Public link copied to clipboard!');
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Collections</h1>
          <p className="text-zinc-400">Organize your knowledge into curated spaces.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </header>

      {showAdd && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
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
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map(collection => (
          <div key={collection.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{collection.name}</h3>
              <button
                onClick={() => handleTogglePublic(collection)}
                className={`p-2 rounded-lg transition-colors ${collection.isPublic ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                title={collection.isPublic ? "Make Private" : "Publish"}
              >
                {collection.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-zinc-400 text-sm mb-6 flex-1">
              {collection.description || 'No description'}
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800">
              <span className="text-sm text-zinc-500">
                {collection.itemIds?.length || 0} items
              </span>
              {collection.isPublic && (
                <button
                  onClick={() => copyLink(collection.id)}
                  className="text-sm text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
              )}
            </div>
          </div>
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
