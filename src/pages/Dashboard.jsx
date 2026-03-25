import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToItems, subscribeToCollections, addItemToCollection } from '../services/db';
import { format, differenceInDays } from 'date-fns';
import { FileText, Image as ImageIcon, Video, File, StickyNote, ExternalLink, Sparkles, MessageCircle, FolderPlus, Loader2 } from 'lucide-react';

const TypeIcon = ({ type }) => {
  switch (type) {
    case 'article': return <FileText className="w-5 h-5 text-blue-400" />;
    case 'video': return <Video className="w-5 h-5 text-red-400" />;
    case 'image': return <ImageIcon className="w-5 h-5 text-green-400" />;
    case 'pdf': return <File className="w-5 h-5 text-orange-400" />;
    case 'social': return <MessageCircle className="w-5 h-5 text-pink-400" />;
    default: return <StickyNote className="w-5 h-5 text-yellow-400" />;
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [resurfacedItem, setResurfacedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for Add to Collection dropdown
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [addingToCollection, setAddingToCollection] = useState(false);

  useEffect(() => {
    if (!user) return;

    let itemsLoaded = false;
    let collectionsLoaded = false;

    const checkLoading = () => {
      if (itemsLoaded && collectionsLoaded) {
        setLoading(false);
      }
    };

    const unsubItems = subscribeToItems(user.uid, (itemsData) => {
      setItems(itemsData);
      itemsLoaded = true;
      
      if (itemsData.length > 0) {
        const olderItems = itemsData.filter(item => {
          if (!item.createdAt?.toDate) return false;
          const daysOld = differenceInDays(new Date(), item.createdAt.toDate());
          return daysOld > 7;
        });
        
        if (olderItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * olderItems.length);
          setResurfacedItem(olderItems[randomIndex]);
        } else if (itemsData.length > 3) {
          const randomIndex = Math.floor(Math.random() * itemsData.length);
          setResurfacedItem(itemsData[randomIndex]);
        }
      }
      checkLoading();
    });

    const unsubCollections = subscribeToCollections(user.uid, (collectionsData) => {
      setCollections(collectionsData);
      collectionsLoaded = true;
      checkLoading();
    });

    return () => {
      unsubItems();
      unsubCollections();
    };
  }, [user]);

  const handleAddToCollection = async (collectionId, itemId) => {
    setAddingToCollection(true);
    try {
      await addItemToCollection(collectionId, itemId);
      alert('Added to collection!');
      setActiveDropdown(null);
    } catch (err) {
      console.error(err);
      alert('Failed to add to collection');
    } finally {
      setAddingToCollection(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading your brain...</div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-zinc-400">Welcome back to your second brain.</p>
      </header>

      {resurfacedItem && (
        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-2 text-indigo-300 mb-4 font-medium">
            <Sparkles className="w-5 h-5" />
            <span>Memory Resurfaced</span>
            <span className="text-indigo-400/60 text-sm ml-2">
              {resurfacedItem.createdAt?.toDate ? `Saved ${differenceInDays(new Date(), resurfacedItem.createdAt.toDate())} days ago` : 'From your archives'}
            </span>
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl font-semibold text-zinc-100 mb-2">{resurfacedItem.title}</h2>
            <p className="text-indigo-200/80 mb-4 line-clamp-3">{resurfacedItem.summary || resurfacedItem.content}</p>
            {resurfacedItem.url && (
              <a 
                href={resurfacedItem.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Revisit Content
              </a>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Recent Additions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors flex flex-col relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-950 rounded-lg">
                  <TypeIcon type={item.type} />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-100 line-clamp-1" title={item.title}>{item.title}</h3>
                  <p className="text-xs text-zinc-500">
                    {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                    title="Add to Collection"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                  {activeDropdown === item.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 py-1">
                      <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-700">
                        Add to Collection
                      </div>
                      {collections.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-zinc-500">No collections yet</div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto">
                          {collections.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleAddToCollection(c.id, item.id)}
                              disabled={addingToCollection}
                              className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors truncate"
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 p-1">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
            
            {item.type === 'image' && item.url && (
              <div className="mb-4 rounded-lg overflow-hidden bg-zinc-950 h-32 flex items-center justify-center">
                <img src={item.url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}

            <p className="text-sm text-zinc-400 line-clamp-3 mb-4 flex-1">
              {item.summary || item.content}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-zinc-800/50">
              {item.tags?.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-400 mb-2">Your brain is empty.</p>
            <p className="text-sm text-zinc-500">Click "Add Content" in the sidebar to start saving.</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
