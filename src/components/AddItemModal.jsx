import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveItem } from '../services/db';
import { X, Loader2, Link as LinkIcon } from 'lucide-react';

export default function AddItemModal({ onClose }) {
  const { user } = useAuth();
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);

  const handleAutoFill = async () => {
    if (!url) return;
    setFetchingMeta(true);
    try {
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (json.status === 'success') {
        setTitle(json.data.title || '');
        setContent(json.data.description || json.data.title || 'No description available.');
        
        // Auto-detect type
        const urlLower = url.toLowerCase();
        if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
          setType('video');
        } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com') || urlLower.includes('instagram.com')) {
          setType('social');
        } else {
          setType('article');
        }
      } else {
        alert('Could not fetch metadata for this URL.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching metadata.');
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await saveItem(user.uid, {
        type,
        title,
        content,
        url: url || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-100">Add to Second Brain</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">URL (Optional)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
              <button
                type="button"
                onClick={handleAutoFill}
                disabled={!url || fetchingMeta}
                className="bg-zinc-800 text-zinc-100 px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {fetchingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                Auto-fill
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700"
            >
              <option value="note">Note</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="social">Social Media</option>
              <option value="image">Image</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Content / Description</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste content or write a description..."
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-zinc-100 text-zinc-900 px-6 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Processing AI...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
